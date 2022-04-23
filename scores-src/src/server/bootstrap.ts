/**
 * Bootstrap is responsible for setting up the state of the application on first install,
 * when it has no users. It allows an admin with access to either the logs or the DB to
 * create a local user.
 */

import { DocumentNotFoundError } from "couchbase";
import { DB } from "./db";
import { getLogger } from "./loggingSetup";
import { randomUUID, timingSafeEqual } from "crypto";
import { BadRequest, Forbidden } from "http-errors";
import { createLocalUser } from "./auth";
import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import { ensure } from "./errs";

const logger = getLogger("bootstrap");

type BootstrapState =
  | { bootstrapped: true }
  | { bootstrapped: false; token: string };

const stateKey = "BootstrapState";

export type IsBootstrapped = boolean | "waiting";

export async function isBootstrapped(): Promise<IsBootstrapped> {
  try {
    const result = await DB.collection("_default").get(stateKey);
    const data = result.content as BootstrapState;
    return data.bootstrapped ? true : "waiting";
  } catch (e) {
    if (e instanceof DocumentNotFoundError) {
      return false;
    }
    throw e;
  }
}

export async function maybeSetupBootstrap() {
  const state = await isBootstrapped();
  if (state === true) {
    logger.debug("No need to bootstrap.");
    return;
  }
  if (state === "waiting") {
    const info = await DB.collection("_default").get(stateKey);
    const token = info.content.token;
    logger.info(
      "Incomplete bootstrap found. To bootstrap this instance, open the web UI and enter the following bootstrap token: " +
        token
    );
    return;
  }
  const token = randomUUID();
  const data: BootstrapState = {
    bootstrapped: false,
    token,
  };
  await DB.collection("_default").insert(stateKey, data);
  logger.info(
    "No existing application data found. To bootstrap this instance, open the web UI and enter the following bootstrap token: " +
      token
  );
}

export async function checkToken(token: string) {
  const res = await DB.collection("_default").get(stateKey);
  const data: BootstrapState = res.content;
  if (data.bootstrapped) {
    throw new BadRequest("already bootstrapped");
  }
  return timingSafeEqual(Buffer.from(token), Buffer.from(data.token));
}

export async function bootstrap(
  token: string,
  username: string,
  password: string
) {
  const res = await DB.collection("_default").getAndLock(stateKey, 10);
  const data: BootstrapState = res.content;
  if (data.bootstrapped) {
    throw new BadRequest("already bootstrapped");
  }
  if (!timingSafeEqual(Buffer.from(token), Buffer.from(data.token))) {
    await DB.collection("_default").unlock(stateKey, res.cas);
    throw new Forbidden("invalid token");
  }
  logger.info("Bootstrapping.", { username });
  const user = await createLocalUser(username, password, ["SUDO"]);
  const newData: BootstrapState = {
    bootstrapped: true,
  };
  await DB.collection("_default").replace(stateKey, newData, {
    cas: res.cas,
  });
  return user;
}

export function createBootstrapRouter() {
  const router = Router();
  router.get(
    "/ready",
    expressAsyncHandler(async (req, res) => {
      const state = await isBootstrapped();
      res.status(200).json({
        ok: true,
        ready: state,
      });
    })
  );
  router.post(
    "/checkToken",
    expressAsyncHandler(async (req, res) => {
      ensure(typeof req.body?.token === "string", BadRequest, "no token given");
      const valid = await checkToken(req.body.token);
      res.status(200).json({
        ok: true,
        valid,
      });
    })
  );
  router.post(
    "/bootstrap",
    expressAsyncHandler(async (req, res) => {
      ensure(typeof req.body?.token === "string", BadRequest, "no token given");
      ensure(
        typeof req.body?.username === "string",
        BadRequest,
        "no username given"
      );
      ensure(
        typeof req.body?.password === "string",
        BadRequest,
        "no password given"
      );
      const user = await bootstrap(
        req.body.token,
        req.body.username,
        req.body.password
      );
      delete user.passwordHash;
      res.status(200).json({
        ok: true,
        user,
      });
    })
  );
  return router;
}
