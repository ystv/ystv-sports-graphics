import "dotenv/config";
import "./loggingSetup";
import config from "./config";
import { getLogger } from "loglevel";
import koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import Logger from "koa-logger";
import websockify from "koa-websocket";
import cors from "@koa/cors";
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

(async () => {
  await db.connect();
  await redis.connect();

  process.on("exit", async () => {
      await db.disconnect();
      await redis.close();
  });

  const app = websockify(new koa());
  app.use(cors({
    origin: ctx => {
      const requestOrigin = ctx.headers["origin"];
      if (!requestOrigin) {
        return "";
      }
      for (const origin of config.allowedOrigins) {
        if (requestOrigin.startsWith(origin)) {
          return requestOrigin;
        }
      }
      return "";
    }
  }))
  const httpLogger = getLogger("http");
  const indexlogger = getLogger("index.server");
  app.use(
    Logger({
      transporter: (str, args) => {
        if (args.length < 4) {
          return;
        }
        httpLogger.info(
          `${args[1]} "${args[2]}" ${args[3]} ${args[4]} ${args[5]}`
        );
      },
    })
  );
  app.use(
    bodyParser({
      enableTypes: ["json"],
    })
  );

  // Error handler
  app.use(async (ctx, next) => {
    try {
      await next();
      if (ctx.response.status === 404 && !ctx.response.body) {
        ctx.throw(404);
      }
    } catch (e) {
      let code: number;
      let message: string;
      let extra = {};
      if (e instanceof DocumentNotFoundError) {
        code = 404;
        message = "entity not found";
      } else if (isHttpError(e)) {
        code = e.statusCode;
        message = e.message;
      } else if (e instanceof ValidationError) {
        code = 422;
        message = "invalid payload: " + e.errors.join("; ");
        extra = {
          errors: e.inner.map((err) => ({
            path: err.path,
            type: err.type,
            message: err.message,
          })),
        };
      } else {
        httpLogger.error(
          `Uncaught handler error:\npath = ${ctx.request.path}\nerror =`,
          e
        );
        code = 500;
        message = "internal server error, sorry";
      }
      ctx.body = JSON.stringify({
        ...extra,
        error: message,
        cat: `https://http.cat/${code}.jpg`,
      });
      ctx.status = code;
    }
  });

  const baseRouter = new Router({
    prefix: config.pathPrefix,
  });

  for (const router of [
    makeEventAPI(
      "football",
      footballSchema,
      footballActionTypes,
      footballActionFuncs
    ),
  ]) {
    baseRouter.use(router.routes(), router.allowedMethods());
  }

  const eventsRouter = createEventsRouter();
  baseRouter.use(eventsRouter.routes(), eventsRouter.allowedMethods());

  app.use(baseRouter.routes()).use(baseRouter.allowedMethods());

  const liveRouter = createLiveRouter();
  app.ws.use(liveRouter.routes() as any).use(liveRouter.allowedMethods() as any);

  const port = config.port;

  app.listen(port, () => {
    indexlogger.info(`Server listening on port ${port}.`);
  });
})();
