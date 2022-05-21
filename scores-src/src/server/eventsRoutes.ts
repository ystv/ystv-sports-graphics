import { Router } from "express";
import { DB } from "./db";
import asyncHandler from "express-async-handler";
import { authenticate } from "./auth";
import { resolveEventState } from "../common/eventStateHelpers";
import { EVENT_TYPES } from "../common/sports";
import { identity } from "lodash-es";
import invariant from "tiny-invariant";
import { EventMeta, EventMetaSchema } from "../common/types";
import { v4 as uuidv4 } from "uuid";
import { DocumentExistsError } from "couchbase";
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
        WHERE meta(e).id LIKE 'EventMeta/%'
        ORDER BY MILLIS(e.startTime)`
      );
      const onlyCovered = req.query.onlyCovered === "true";
      let events = await Promise.all(
        result.rows.map(async (row) => {
          const meta = row.data as EventMeta;
          const history = await DB.collection("_default").get(
            row.id.replace("EventMeta", "EventHistory")
          );
          const state = resolveEventState(
            EVENT_TYPES[meta.type]?.reducer ?? identity,
            history.content
          );
          return {
            ...meta,
            ...state,
          };
        })
      );
      if (onlyCovered) {
        events = events.filter((x) => !x.notCovered);
      }
      res.status(200).json(events);
    })
  );

  // This handles events coming from RosesLive that we don't have code for.

  const metaKey = (type: string, id: string) => `EventMeta/${type}/${id}`;

  router.get(
    "/_extra/:type/:id",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const { type, id } = req.params;
      invariant(typeof type === "string", "no type from url");
      invariant(typeof id === "string", "no id from url");
      const data = await DB.collection("_default").get(metaKey(type, id));
      res.json({
        ...data.content,
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
      const val: EventMeta = await EventMetaSchema.omit([
        "id",
        "type",
      ]).validate(req.body, { abortEarly: false });
      val.type = type;

      let id: string;

      for (;;) {
        try {
          id = uuidv4();
          val.id = id;
          await DB.collection("_default").insert(metaKey(type, id), val);
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
      const inputData = req.body;
      const val: EventMeta = await EventMetaSchema.omit([
        "id",
        "type",
      ]).validate(inputData, { abortEarly: false, stripUnknown: true });
      await DB.collection("_default").replace(metaKey(type, id), val, {
        cas: cas,
      });
      res.status(200).json(val);
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

      const currentMetaResult = await DB.collection("_default").get(
        metaKey(type, id)
      );
      const val = currentMetaResult.content as EventMeta;

      val.winner = winner;

      await DB.collection("_default").replace(metaKey(type, id), val, {
        cas: currentMetaResult.cas,
      });
      await updateTournamentSummary(logger.child({ _name: "tsWorker" }));
      res.status(200).json(val);
    })
  );

  return router;
}
