import "dotenv/config";
import "./loggingSetup";
import config from "./config";
import { getLogger, Logger } from "loglevel";

import Express, { NextFunction, Request, Response, Router } from "express";
import ExpressWS from "express-ws";
import cors from "cors";
import {json as jsonParser} from "body-parser";

import { makeEventAPI } from "./eventTypeRoutes";
import * as db from "./db";
import * as redis from "./redis";
import { DocumentNotFoundError } from "couchbase";
import { ValidationError } from "yup";
import { isHttpError } from "http-errors";
import { createEventsRouter } from "./eventsRoutes";

import {
    actionFuncs as footballActionFuncs,
    actionTypes as footballActionTypes,
    schema as footballSchema,
  } from "../common/sports/football";
import { createLiveRouter } from "./liveRoutes";

const errorHandler: (log: Logger) => (err: any, req: Request, res: Response, next: NextFunction) => any = (httpLogger) => (err, req, res, next) => {
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
    httpLogger.error(
      `Uncaught handler error:\npath = ${req.path}\nerror =`,
      err
    );
    code = 500;
    message = "internal server error, sorry";
  }
  res.statusCode = code;
  res.json(({
    ...extra,
    error: message,
    cat: `https://http.cat/${code}.jpg`,
  }))
};

(async () => {
  const indexlogger = getLogger("index.server");

  try {
    await db.connect();
  } catch (e) {
    indexlogger.error("Failed to connect to Couchbase!", e);
    process.exit(10);
  }
  try {
    await redis.connect();
  } catch (e) {
    indexlogger.error("Failed to connect to Redis!", e);
    process.exit(11);
  }

  process.on("exit", async () => {
      await db.disconnect();
      await redis.close();
  });

  const app = Express();
  const ws = ExpressWS(app);

  const httpLogger = getLogger("http");
  app.use((req, res, next) => {
    const start = process.hrtime();
    next();
    const diff = process.hrtime(start);
    httpLogger.log(req.method, req.url, res.statusCode, (diff[0] + "ms"));
  });

  app.use(cors({
    origin: config.allowedOrigins
  }));

  app.use(jsonParser());

  // Error handler
  app.use(errorHandler(httpLogger));

  const baseRouter = Router();

  for (const [name, router] of [
    ["football", makeEventAPI(
      "football",
      footballSchema,
      footballActionTypes,
      footballActionFuncs
    )]
  ] as const) {
    baseRouter.use("/events/" + name, router);
  }

  baseRouter.use("/events", createEventsRouter());

  app.use(config.pathPrefix, baseRouter);

  app.use(createLiveRouter());

  const port = config.port;

  app.listen(port, () => {
    indexlogger.info(`Server listening on port ${port}.`);
  });
})();
