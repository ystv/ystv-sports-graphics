import Router from "koa-router";
import type * as ws from "ws";
import type { Context } from "koa";
import { REDIS } from "./redis";
import logging from "loglevel";
import { BadRequest } from "http-errors";
import { randomUUID } from "crypto";
import { getEventChanges, UpdatesMessage } from "./updatesRepo";
import { ensure } from "./errs";
import { DB } from "./db";
import { DocumentNotFoundError } from "couchbase";
import type { LiveClientMessage, LiveServerMessage } from "../common/liveTypes";
import config from "./config";

interface WSContext extends Context {
  websocket: ws;
  path: string;
}

function generateSid(): string {
  return randomUUID();
}

class UserError extends Error {}

export function createLiveRouter() {
  const router = new Router();
  router.get(`${config.pathPrefix}/updates/stream/v2`, async function (ctx: WSContext) {
    function send(msg: LiveServerMessage) {
      ctx.websocket.send(JSON.stringify(msg), err => {
        if (err) {
          logger.warn("WS send error", err);
        }
      });
    }

    let sid: string;
    if ("sid" in ctx.query) {
      ensure(typeof ctx.query.sid === "string", BadRequest, "invalid sid type");
      sid = ctx.query.sid;
    } else {
      sid = "INVALID";
    }

    const subs = new Set<string>(await REDIS.sMembers(`subscriptions:${sid}`));
    if (subs.size === 0) {
      // Reset the SID to signal to the client that they've lost their subscriptions
      sid = generateSid();
    }

    const logger = logging.getLogger(`live:${sid}`);

    ctx.websocket.on("close", (code: number) => {
      logger.info("WebSocket closed", code);
    });

    ctx.websocket.on("error", err => {
      logger.warn("WebSocket error", err);
    })

    logger.debug("hello");
    send({
      kind: "HELLO",
      sid,
      subs: Array.from(subs),
    });

    function dispatchChangeToSubscribedData(mid: string, data: UpdatesMessage) {
      send({
        kind: "CHANGE",
        changed: data.id,
        mid: mid,
        data: JSON.parse(data.data),
      });
    }

    if ("last_mid" in ctx.query) {
      ensure(
        typeof ctx.query.last_mid === "string",
        BadRequest,
        "invalid last_mid type"
      );
      while (true) {
        const data = await getEventChanges(ctx.query.last_mid, 0);
        if (data === null || data.length === 0) {
          logger.debug("Caught up, continuing");
          break;
        }
        for (const msg of data) {
          if (subs.has(msg.data.id)) {
            dispatchChangeToSubscribedData(msg.mid, msg.data);
          }
        }
      }
    }

    ctx.websocket.on("message", async (msg) => {
      try {
        let payload: LiveClientMessage;
        ensure(typeof msg === "string", UserError, "non-string message");
        payload = JSON.parse(msg);
        switch (payload.kind) {
          case "PING":
            send({ kind: "PONG" });
            break;
          case "SUBSCRIBE":
            ensure(
              typeof payload.to === "string",
              UserError,
              "invalid 'to' type"
            );
            subs.add(payload.to);
            await REDIS.sAdd(`subscriptions:${sid}`, payload.to);

            let current;
            try {
              current = (await DB.collection("_default").get(payload.to))
                .content;
            } catch (e) {
              if (e instanceof DocumentNotFoundError) {
                current = {};
              } else {
                throw e;
              }
            }
            send({
              kind: "SUBSCRIBE_OK",
              to: payload.to,
              current,
            });
            break;
          case "UNSUBSCRIBE":
            ensure(
              typeof payload.to === "string",
              UserError,
              "invalid 'to' type"
            );
            subs.delete(payload.to);
            send(
              {
                kind: "UNSUBSCRIBE_OK",
                to: payload.to,
              }
            );
            break;
        }
      } catch (e) {
        if (e instanceof UserError) {
          send({
            kind: "ERROR",
            error: e.message,
          });
        } else {
          throw e;
        }
      }
    });

    let lastMid = "$";

    while (true) {
      const data = await getEventChanges(lastMid, 5_000);
      if (ctx.websocket.readyState === ctx.websocket.CLOSED) {
        logger.info("WebSocket state is CLOSED, ending Redis loop.");
        return;
      }
      if (data === null) {
        send({ kind: "PING" });
        continue;
      }
      for (const msg of data) {
        if (subs.has(msg.data.id)) {
          dispatchChangeToSubscribedData(msg.mid, msg.data);
        }
        lastMid = msg.mid;
        logger.debug("MID is now", msg.mid);
      }
    }
  } as any);

  return router;
}