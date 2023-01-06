import { getLogger } from "./loggingSetup";
import { Router } from "express";
import asyncHandler from "express-async-handler";
import { DB } from "./db";
import { ensure, invariant } from "./errs";
import { BadRequest } from "http-errors";
import { createLocalUser } from "./auth";
import { QueryScanConsistency } from "couchbase";

const logger = getLogger("testRoutes");

export function createTestRouter() {
  invariant(
    process.env.NODE_ENV === "test",
    `Tried to create test router in NODE_ENV=${process.env.NODE_ENV}`
  );
  const router = Router();

  router.post(
    "/resetDB",
    asyncHandler(async (req, res) => {
      await DB.query("DELETE FROM _default", {
        scanConsistency: QueryScanConsistency.RequestPlus,
      });
      await DB.collection("_default").insert("BootstrapState", {
        bootstrapped: true,
      });
      // Execute another dummy query to check that everything's caught up
      await DB.query(
        "SELECT * FROM _default WHERE meta().id = 'BootstrapState'",
        {
          scanConsistency: QueryScanConsistency.RequestPlus,
        }
      );
      res.status(200).json({ ok: true });
    })
  );

  router.post(
    "/createTestUser",
    asyncHandler(async (req, res) => {
      const { username, password } = req.body;
      ensure(typeof username === "string", BadRequest, "no username");
      ensure(typeof password === "string", BadRequest, "no password");
      await createLocalUser(username, password, ["SUDO"]);
      res.status(200).json({ ok: true });
    })
  );

  return router;
}
