import * as Yup from "yup";
import { DB } from "./db";
import { v4 as uuidv4 } from "uuid";
import { Router } from "express";
import asyncHandler from "express-async-handler";
import { PreconditionFailed } from "http-errors";
import { DocumentExistsError, MutateInSpec } from "couchbase";
import { EventActionFunctions, EventActionTypes } from "../common/types";
import { dispatchChangeToEvent } from "./updatesRepo";
import {
  Action,
  ActionPayloadValidators,
  ActionValidChecks,
  Edit,
  Init,
  Reducer,
  resolveEventState,
  wrapAction,
} from "../common/eventStateHelpers";
import { authenticate } from "./auth";
import { actionValidChecks } from "../common/sports/netball";
import invariant from "tiny-invariant";

export function makeEventAPI<
  TState extends Record<string, unknown>,
  TActions extends Record<string, (payload?: any) => Action>
>(
  typeName: string,
  reducer: Reducer<TState>,
  schema: Yup.SchemaOf<TState>,
  actions: TActions,
  actionValidators: ActionPayloadValidators<TActions>,
  checks: ActionValidChecks<TState, TActions>
) {
  const router = Router();

  const key = (id: string) => `Event/${typeName}/${id}`;

  router.get(
    "/",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const result = await DB.query(
        `SELECT RAW e FROM _default e WHERE meta(e).id LIKE 'Event/${typeName}/%'`
      );
      res.json(result.rows.map((row) => resolveEventState(reducer, row)));
    })
  );

  router.get(
    "/:id",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const data = await DB.collection("_default").get(key(id));
      res.json(resolveEventState(reducer, data.content));
    })
  );

  router.post(
    "/",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const val: TState = await schema
        .omit(["id", "type"])
        .validate(req.body, { abortEarly: false });

      const initAction = wrapAction(Init(val));
      let id: string;

      for (;;) {
        try {
          id = uuidv4();
          initAction.payload.id = id;
          await DB.collection("_default").insert(key(id), [initAction]);
          break;
        } catch (e) {
          if (e instanceof DocumentExistsError) {
            continue;
          }
          throw e;
        }
      }
      await dispatchChangeToEvent(key(id), initAction);
      res.statusCode = 201;
      res.json(val);
    })
  );

  router.put(
    "/:id",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const data = await DB.collection("_default").get(key(id));
      const currentActions = data.content as Action[];
      const inputData = req.body;
      const val: TState = await schema
        .omit(["id", "type"])
        .validate(inputData, { abortEarly: false, stripUnknown: true });
      const action = wrapAction(Edit(val));
      await DB.collection("_default").mutateIn(
        key(id),
        [MutateInSpec.arrayAppend("", action)],
        {
          cas: data.cas,
        }
      );
      await dispatchChangeToEvent(key(id), action);
      res
        .status(200)
        .json(resolveEventState(reducer, currentActions.concat(action)));
    })
  );

  for (const actionType of Object.keys(actions)) {
    router.post(
      `/:id/${actionType}`,
      authenticate("write"),
      asyncHandler(async (req, res) => {
        const id = req.params.id;
        invariant(typeof id === "string", "route didn't give us a string id");
        const payload: ReturnType<TActions[typeof actionType]> =
          await actionValidators[actionType].validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
          });

        const currentActionsResult = await DB.collection("_default").get(
          key(id)
        );
        const currentActions = currentActionsResult.content as Action[];
        const currentState = resolveEventState(reducer, currentActions);

        const checkFn = checks[actionType];
        if (typeof checkFn === "function") {
          if (!checkFn(currentState)) {
            throw new PreconditionFailed("action not valid at this time");
          }
        }

        const actionData = wrapAction(actions[actionType](payload));

        await DB.collection("_default").mutateIn(
          key(id),
          [MutateInSpec.arrayAppend("", actionData)],
          {
            cas: currentActionsResult.cas,
          }
        );
        await dispatchChangeToEvent(key(id), actionData);
        res
          .status(200)
          .json(resolveEventState(reducer, currentActions.concat(actionData)));
      })
    );
  }

  return router;
}
