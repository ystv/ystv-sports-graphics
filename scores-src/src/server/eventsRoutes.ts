import { Router } from "express";
import { DB } from "./db";
import asyncHandler from "express-async-handler";
import { authenticate } from "./auth";

export function createEventsRouter() {
  const router = Router();

  router.get(
    "/",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const result = await DB.query(
        `SELECT RAW e FROM _default e WHERE meta(e).id LIKE 'Event/%'`
      );
      res.status(200).json(result.rows);
    })
  );

  return router;
}
