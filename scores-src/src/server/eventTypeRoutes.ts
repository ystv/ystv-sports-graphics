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
  Redo,
  Reducer,
  resolveEventState,
  Undo,
  wrapAction,
} from "../common/eventStateHelpers";
import { authenticate } from "./auth";
import { EventTypeInfo, EVENT_TYPES } from "../common/sports";
import { ensure, invariant } from "./errs";
import { BadRequest } from "http-errors";
import { getLogger } from "./loggingSetup";

export function makeEventAPIFor<
  TState extends Record<string, unknown>,
  TActions extends Record<
    string,
    (payload?: any) => Action<Record<string, unknown>>
  >
>(typeName: string, info: EventTypeInfo<TState, TActions>) {
  const logger = getLogger("eventTypeAPI").child({
    type: typeName,
  });
  const router = Router();

  const key = (id: string) => `Event/${typeName}/${id}`;
  const {
    reducer,
    actionCreators,
    actionPayloadValidators,
    actionValidChecks,
    schema,
  } = info;

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
      res.json({
        ...resolveEventState(reducer, data.content),
        _cas: data.cas,
      });
    })
  );

  router.get(
    "/:id/_history",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const data = await DB.collection("_default").get(key(id));
      res.json(data.content);
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
      const cas = req.params["cas"] ?? undefined;
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
          cas: cas ?? data.cas,
        }
      );
      await dispatchChangeToEvent(key(id), action);
      res
        .status(200)
        .json(resolveEventState(reducer, currentActions.concat(action)));
    })
  );

  router.post(
    "/:id/_undo",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      invariant(typeof id === "string", "route didn't give us a string id");
      const ts = req.body.ts;
      ensure(typeof ts === "number", BadRequest, "no ts given");

      const currentActionsResult = await DB.collection("_default").get(key(id));
      const currentActions = currentActionsResult.content as Action[];
      const undoneIndex = currentActions.findIndex((x) => x.meta.ts === ts);
      ensure(undoneIndex > -1, BadRequest, "no action with that ts");
      const undoAction = wrapAction(Undo({ ts }));
      currentActions.push(undoAction);

      await DB.collection("_default").mutateIn(
        key(id),
        [MutateInSpec.arrayAppend("", undoAction)],
        {
          cas: currentActionsResult.cas,
        }
      );
      await dispatchChangeToEvent(key(id), undoAction);
      res.status(200).json(resolveEventState(reducer, currentActions));
    })
  );

  router.post(
    "/:id/_redo",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      invariant(typeof id === "string", "route didn't give us a string id");
      const ts = req.body.ts;
      ensure(typeof ts === "number", BadRequest, "no ts given");

      const currentActionsResult = await DB.collection("_default").get(key(id));
      const currentActions = currentActionsResult.content as Action[];
      const redoneIndex = currentActions.findIndex((x) => x.meta.ts === ts);
      ensure(redoneIndex > -1, BadRequest, "no action with that ts");
      const redoAction = wrapAction(Redo({ ts }));

      // Special case: if the undo action was the last one, we can delete it,
      // rather than adding a redo.
      // We still need to dispatch a redo to the repo though.
      const spec: MutateInSpec[] = [];
      if (
        Undo.match(currentActions[currentActions.length - 1]) &&
        currentActions[currentActions.length - 1].payload.ts === ts
      ) {
        logger.debug("Redo: special case matched", {
          lastThree: currentActions.slice(currentActions.length - 3),
        });
        currentActions.splice(currentActions.length - 1, 1);
        // no +1 here as we've already removed the last action - really this is (currentActions.length - 1 + 1)
        spec.push(MutateInSpec.remove(`[${currentActions.length}]`));
      } else {
        logger.debug("Redo: special case NOT matched", {
          lastThree: currentActions.slice(currentActions.length - 3),
        });
        currentActions.push(redoAction);
        spec.push(MutateInSpec.arrayAppend("", redoAction));
      }

      await DB.collection("_default").mutateIn(key(id), spec, {
        cas: currentActionsResult.cas,
      });
      await dispatchChangeToEvent(key(id), redoAction);
      res.status(200).json(resolveEventState(reducer, currentActions));
    })
  );

  for (const actionType of Object.keys(actionCreators)) {
    router.post(
      `/:id/${actionType}`,
      authenticate("write"),
      asyncHandler(async (req, res) => {
        const id = req.params.id;
        invariant(typeof id === "string", "route didn't give us a string id");
        const payload: ReturnType<TActions[typeof actionType]> =
          await actionPayloadValidators[actionType].validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
          });

        const currentActionsResult = await DB.collection("_default").get(
          key(id)
        );
        const currentActions = currentActionsResult.content as Action[];
        const currentState = resolveEventState(reducer, currentActions);

        const checkFn = actionValidChecks[actionType];
        if (typeof checkFn === "function") {
          if (!checkFn(currentState)) {
            throw new PreconditionFailed("action not valid at this time");
          }
        }

        const actionData = wrapAction(actionCreators[actionType](payload));

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

export function createEventTypesRouter() {
  const router = Router();
  for (const [typeName, info] of Object.entries(EVENT_TYPES)) {
    router.use(`/${typeName}`, makeEventAPIFor(typeName, info));
  }
  return router;
}
