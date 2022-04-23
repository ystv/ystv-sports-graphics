import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import { BadRequest } from "http-errors";
import {
  authenticate,
  authenticateUser,
  createSessionForUser,
  setSessionCookie,
} from "./auth";
import { ensure, invariant } from "./errs";

export function createAuthRouter() {
  const router = Router();

  router.get(
    "/me",
    authenticate(),
    expressAsyncHandler(async (req, res) => {
      invariant(
        typeof req.user !== "undefined",
        "made it into /me without a user"
      );
      res.status(200).json(req.user);
    })
  );

  router.post(
    "/login/local",
    expressAsyncHandler(async (req, res) => {
      const { username, password } = req.body;
      ensure(typeof username === "string", BadRequest, "no username");
      ensure(typeof password === "string", BadRequest, "no password");
      const user = await authenticateUser(username, password);
      const sid = await createSessionForUser(username);
      setSessionCookie(res, sid);
      res.status(200).json({
        ok: true,
        user,
        token: sid,
      });
    })
  );

  return router;
}
