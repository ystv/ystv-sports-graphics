import { Router } from "express";
import { DB } from "./db";
import asyncHandler from "express-async-handler";
import { authenticate } from "./auth";
import { resolveEventState } from "../common/eventStateHelpers";
import { EVENT_TYPES } from "../common/sports";

export function createEventsRouter() {
  const router = Router();

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
      res.status(200).json(
        result.rows.map((row) => {
          const [_, type] = row.id.split("/");
          console.log(row.id);
          const data = resolveEventState(EVENT_TYPES[type].reducer, row.data);
          return {
            ...data,
            type,
          };
        })
      );
    })
  );

  return router;
}
