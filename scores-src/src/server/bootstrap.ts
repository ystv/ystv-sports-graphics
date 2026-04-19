/**
 * Bootstrap is responsible for setting up the state of the application on first install,
 * when it has no users. It allows an admin with access to either the logs or the DB to
 * create a local user.
 */

// import { DocumentNotFoundError } from "couchbase";
// import { DB } from "./db";
import { getLogger } from "./loggingSetup";
import { randomUUID, timingSafeEqual } from "crypto";
import { BadRequest, Forbidden } from "http-errors";
import { createLocalUser, localUserExists } from "./auth";
import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import { ensure } from "./errs";
import config from "./config";

const logger = getLogger("bootstrap");

type BootstrapState =
  | { bootstrapped: true }
  | { bootstrapped: false; token: string };

const stateKey = "BootstrapState";

export type IsBootstrapped = boolean | "waiting";

export async function isBootstrapped(): Promise<boolean> {
  return localUserExists(config.initialUser.username);
}

export async function maybeSetupBootstrap() {
  const state = await isBootstrapped();
  if (state === true) {
    logger.debug("No need to bootstrap.");
    return;
  } else {
    await bootstrap();
  }
  const token = randomUUID();
  logger.info(
    "No existing application data found. To bootstrap this instance, open the web UI and enter the following bootstrap token: " +
      token
  );
}

export async function bootstrap() {
  logger.info("Bootstrapping.", config.initialUser.username);
  const user = await createLocalUser(
    config.initialUser.username,
    config.initialUser.password,
    ["SUDO"]
  );
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
    "/bootstrap",
    expressAsyncHandler(async (req, res) => {
      const user = await bootstrap();
      res.status(200).json({
        ok: true,
        user,
      });
    })
  );
  return router;
}
