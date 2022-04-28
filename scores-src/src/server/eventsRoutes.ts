import { Router } from "express";
import { DB } from "./db";
import asyncHandler from "express-async-handler";
import { authenticate } from "./auth";
import {
  DeclareWinner,
  Edit,
  Init,
  resolveEventState,
  wrapAction,
  wrapReducer,
} from "../common/eventStateHelpers";
import { EVENT_TYPES } from "../common/sports";
import { identity } from "lodash-es";
import invariant from "tiny-invariant";
import { Action, BaseEvent, BaseEventType } from "../common/types";
import { v4 as uuidv4 } from "uuid";
import { DocumentExistsError, MutateInSpec } from "couchbase";
import { ensure } from "./errs";
import { BadRequest } from "http-errors";
import { doUpdate as updateTournamentSummary } from "./updateTournamentSummary.job";
import { getLogger } from "./loggingSetup";

export function createEventsRouter() {
  const router = Router();
  const logger = getLogger("events");

  router.get(
    "/",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const result = await DB.query(
        `SELECT e AS data, meta().id AS id
        FROM _default e
        WHERE meta(e).id LIKE 'Event/%'
        ORDER BY MILLIS(ARRAY_REVERSE(ARRAY x.payload.startTime FOR x IN e WHEN x.type = '@@init' OR x.type = '@@edit' END)[0])`
      );
      const onlyCovered = req.query.onlyCovered === "true";
      let events = result.rows.map((row) => {
        const [_, type] = row.id.split("/");
        const data: BaseEventType = resolveEventState(
          EVENT_TYPES[type]?.reducer ?? identity,
          row.data
        );
        return {
          ...data,
          type,
        };
      });
      if (onlyCovered) {
        events = events.filter((x) => !x.notCovered);
      }
      res.status(200).json(events);
    })
  );

  // This handles events coming from RosesLive that we don't have code for.

  const key = (type: string, id: string) => `Event/${type}/${id}`;

  router.get(
    "/_extra/:type/:id",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const { type, id } = req.params;
      invariant(typeof type === "string", "no type from url");
      invariant(typeof id === "string", "no id from url");
      const data = await DB.collection("_default").get(key(type, id));
      res.json({
        ...resolveEventState(
          wrapReducer<BaseEventType>(identity),
          data.content
        ),
        _cas: data.cas,
      });
    })
  );

  router.post(
    "/_extra/:type",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const type = req.params.type;
      invariant(typeof type === "string", "no type param from URL");
      const val: BaseEventType = await BaseEvent.omit(["id", "type"]).validate(
        req.body,
        { abortEarly: false }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initAction = wrapAction(Init(val) as any);
      let id: string;

      for (;;) {
        try {
          id = uuidv4();
          initAction.payload.id = id;
          await DB.collection("_default").insert(key(type, id), [initAction]);
          break;
        } catch (e) {
          if (e instanceof DocumentExistsError) {
            continue;
          }
          throw e;
        }
      }
      res.statusCode = 201;
      res.json(val);
    })
  );

  router.put(
    "/_extra/:type/:id",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const { type, id } = req.params;
      invariant(typeof type === "string", "no type param from URL");
      invariant(typeof id === "string", "no id param from URL");
      const cas = req.params["cas"] ?? undefined;
      const data = await DB.collection("_default").get(key(type, id));
      const currentActions = data.content as Action[];
      const inputData = req.body;
      const val: BaseEventType = await BaseEvent.omit(["id", "type"]).validate(
        inputData,
        { abortEarly: false, stripUnknown: true }
      );
      const action = wrapAction(Edit(val));
      await DB.collection("_default").mutateIn(
        key(type, id),
        [MutateInSpec.arrayAppend("", action)],
        {
          cas: cas ?? data.cas,
        }
      );
      res
        .status(200)
        .json(
          resolveEventState(
            wrapReducer(identity),
            currentActions.concat(action)
          )
        );
    })
  );

  router.post(
    "/_extra/:type/:id/_declareWinner",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const { type, id } = req.params;
      invariant(typeof type === "string", "no type param from URL");
      invariant(typeof id === "string", "no id param from URL");

      const winner: "home" | "away" = req.body.winner;
      ensure(
        typeof winner === "string" && (winner === "home" || winner === "away"),
        BadRequest,
        "invalid or no winner"
      );

      const currentActionsResult = await DB.collection("_default").get(
        key(type, id)
      );
      const currentActions = currentActionsResult.content as Action[];

      const actionData = wrapAction(DeclareWinner({ winner }));

      await DB.collection("_default").mutateIn(
        key(type, id),
        [MutateInSpec.arrayAppend("", actionData)],
        {
          cas: currentActionsResult.cas,
        }
      );
      await updateTournamentSummary(logger.child({ _name: "tsWorker" }));
      res
        .status(200)
        .json(
          resolveEventState(
            wrapReducer<BaseEventType>(identity),
            currentActions.concat(actionData)
          )
        );
    })
  );

  return router;
}
