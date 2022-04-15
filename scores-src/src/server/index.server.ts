import "dotenv/config";
import "./loggingSetup";
import config from "./config";
import * as logging from "./loggingSetup";

import Express, { NextFunction, Request, Response, Router } from "express";
import ExpressWS from "express-ws";
import cors from "cors";
import { json as jsonParser } from "body-parser";
import onFinished from "on-finished";

import { makeEventAPI } from "./eventTypeRoutes";
import * as db from "./db";
import * as redis from "./redis";
import { DocumentNotFoundError } from "couchbase";
import { ValidationError } from "yup";
import { isHttpError, NotFound } from "http-errors";
import { createEventsRouter } from "./eventsRoutes";

import {
  actionFuncs as footballActionFuncs,
  actionTypes as footballActionTypes,
  schema as footballSchema,
} from "../common/sports/football";
import {
  actionFuncs as netballActionFuncs,
  actionTypes as netballActionTypes,
  schema as netballSchema,
} from "../common/sports/netball";
import { createLiveRouter } from "./liveRoutes";
import {
  httpRequestDurationSeconds,
  httpResponseStatus,
  metricsHandler,
} from "./metrics";
import asyncHandler from "express-async-handler";
import { Logger } from "winston";
import { createBootstrapRouter, maybeSetupBootstrap } from "./bootstrap";
import { createAuthRouter } from "./auth";

const errorHandler: (
  log: Logger
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => (err: any, req: Request, res: Response, next: NextFunction) => any =
  (httpLogger) => (err, req, res, next) => {
    let code: number;
    let message: string;
    let extra = {};
    if (err instanceof DocumentNotFoundError) {
      code = 404;
      message = "entity not found";
    } else if (isHttpError(err)) {
      code = err.statusCode;
      message = err.message;
    } else if (err instanceof ValidationError) {
      code = 422;
      message = "invalid payload: " + err.errors.join("; ");
      extra = {
        errors: err.inner.map((err) => ({
          path: err.path,
          type: err.type,
          message: err.message,
        })),
      };
    } else {
      let errType: string;
      let errMsg: string;
      if (err instanceof Error) {
        errType = err.name;
        errMsg = err.message + "\n" + err.stack;
      } else {
        errType = typeof err;
        errMsg = JSON.stringify(err);
      }
      httpLogger.error(`Uncaught handler error`, {
        url: req.baseUrl,
        type: errType,
        error: errMsg,
      });
      code = 500;
      message = "internal server error, sorry";
    }
    res.statusCode = code;
    res.json({
      ...extra,
      error: message,
      cat: `https://http.cat/${code}.jpg`,
    });
  };

(async () => {
  const indexlogger = logging.getLogger("index.server");

  try {
    await db.connect();
  } catch (e) {
    indexlogger.error("Failed to connect to Couchbase!", { error: e });
    process.exit(10);
  }
  try {
    await redis.connect();
  } catch (e) {
    indexlogger.error("Failed to connect to Redis!", { error: e });
    process.exit(11);
  }

  process.on("exit", async () => {
    await db.disconnect();
    await redis.close();
  });

  await maybeSetupBootstrap();

  const app = Express();
  const ws = ExpressWS(app);

  const httpLogger = logging.getLogger("http");

  // Logger
  app.use((req, res, next) => {
    const start = process.hrtime();
    onFinished(res, (err, res) => {
      // No need to handle the err, as the error-handler middleware will transform it into
      // a response.
      const diff = process.hrtime(start);
      httpLogger.info(req.method + " " + req.originalUrl, {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: diff[0] + "ms" + diff[1] + "ns",
      });
      // Don't create metrics for 404s - DoS vector
      if (res.statusCode !== 404) {
        const path = new URL(req.originalUrl, `http://${req.hostname}`)
          .pathname;
        httpRequestDurationSeconds
          .labels({
            method: req.method,
            path: path,
          })
          .observe(diff[0] / 1000 + diff[1] / 1e9);
        httpResponseStatus
          .labels({
            method: req.method,
            path: path,
            code: res.statusCode,
          })
          .inc();
      }
    });
    next();
  });

  app.use(
    cors({
      origin: config.allowedOrigins,
    })
  );

  app.use(jsonParser());

  const baseRouter = Router();

  baseRouter.use("/bootstrap", createBootstrapRouter());
  baseRouter.use("/auth", createAuthRouter());

  for (const [name, router] of [
    [
      "football",
      makeEventAPI(
        "football",
        footballSchema,
        footballActionTypes,
        footballActionFuncs
      ),
    ],
    [
      "netball",
      makeEventAPI(
        "netball",
        netballSchema,
        netballActionTypes,
        netballActionFuncs
      ),
    ],
  ] as const) {
    baseRouter.use("/events/" + name, router);
  }

  baseRouter.use("/events", createEventsRouter());

  app.use(config.pathPrefix, baseRouter);
  app.use(config.pathPrefix, createLiveRouter());

  app.get("/metrics", metricsHandler);

  app.get("/healthz", (_, res) => {
    res.status(200).send(`{"ok": true}`);
  });

  app.get(
    "/readyz",
    asyncHandler(async (_, res) => {
      await db.cluster.ping();
      await redis.REDIS.ping();
      res.status(200).send(`{"ok": true}`);
    })
  );

  app.get("/metrics", metricsHandler);

  app.get("/healthz", (_, res) => {
    res.status(200).send(`{"ok": true}`);
  });

  app.get(
    "/readyz",
    asyncHandler(async (_, res) => {
      await db.cluster.ping();
      await redis.REDIS.ping();
      res.status(200).send(`{"ok": true}`);
    })
  );

  // 404 handler
  app.use("*", (req, res, next) => {
    next(new NotFound(`Cannot ${req.method} ${req.path}`));
  });

  // Error handler
  app.use(errorHandler(httpLogger));

  const port = config.port;

  app.listen(port, () => {
    indexlogger.info(`Server listening on port ${port}.`);
  });
})();
