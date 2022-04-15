import "express-ws";
import type * as ws from "ws";
import { REDIS } from "./redis";
import * as logging from "./loggingSetup";
import { BadRequest } from "http-errors";
import { randomUUID } from "crypto";
import { getEventChanges, UpdatesMessage } from "./updatesRepo";
import { ensure } from "./errs";
import { DB } from "./db";
import { DocumentNotFoundError } from "couchbase";
import type { LiveClientMessage, LiveServerMessage } from "../common/liveTypes";
import config from "./config";
import { Request, Router } from "express";
import { activeStreamConnections } from "./metrics";
import { verifyToken } from "./auth";
import { URLSearchParams } from "url";

function generateSid(): string {
  return randomUUID();
}

class UserError extends Error {}

export function createLiveRouter() {
  const router = Router();
  router.ws(`/updates/stream/v2`, async function (ws: ws, req: Request) {
    logging
      .getLogger("live")
      .debug("Received WS connection", { remote: req.ip });
    activeStreamConnections.inc();

    let sid: string;
    if ("sid" in req.query) {
      ensure(typeof req.query.sid === "string", BadRequest, "invalid sid type");
      sid = req.query.sid;
    } else {
      sid = "INVALID";
    }

    const logger = logging.getLogger(`live`).child({ sid });

    const url = new URL(req.originalUrl, `http://ystv.internal`);
    const query = new URLSearchParams(url.search);
    const token = query.get("token");
    if (token === null) {
      logger.info("Rejecting because no token was given");
      ws.close(1008);
      return;
    }
    try {
      verifyToken(token, ["read"]);
    } catch (e) {
      logger.info("Rejecting because the token was invalid");
      ws.close(1008);
      return;
    }

    function send(msg: LiveServerMessage) {
      ws.send(JSON.stringify(msg), (err) => {
        if (err) {
          logger.warn("WS send error", { error: err });
        }
      });
    }

    const subs = new Set<string>(await REDIS.sMembers(`subscriptions:${sid}`));
    if (subs.size === 0) {
      // Reset the SID to signal to the client that they've lost their subscriptions
      sid = generateSid();
    }

    ws.on("close", (code: number) => {
      logger.info("WebSocket closed", { code: code });
      activeStreamConnections.dec();
    });

    ws.on("error", (err) => {
      logger.warn("WebSocket error", { error: err });
    });

    logger.debug("HELLO");
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

    if ("last_mid" in req.query) {
      ensure(
        typeof req.query.last_mid === "string",
        BadRequest,
        "invalid last_mid type"
      );
      for (;;) {
        const data = await getEventChanges(logger, req.query.last_mid, 0);
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

    ws.on("message", async (msg) => {
      try {
        ensure(typeof msg === "string", UserError, "non-string message");
        const payload: LiveClientMessage = JSON.parse(msg);
        switch (payload.kind) {
          case "PING":
            send({ kind: "PONG" });
            break;
          case "SUBSCRIBE": {
            ensure(
              typeof payload.to === "string",
              UserError,
              "invalid 'to' type"
            );
            subs.add(payload.to);
            await REDIS.sAdd(`subscriptions:${sid}`, payload.to);
            await REDIS.expire(
              `subscriptions:${sid}`,
              config.subscriptionLifetime
            );

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
          }
          case "UNSUBSCRIBE":
            ensure(
              typeof payload.to === "string",
              UserError,
              "invalid 'to' type"
            );
            subs.delete(payload.to);
            await REDIS.sRem(`subscriptions:${sid}`, payload.to);
            send({
              kind: "UNSUBSCRIBE_OK",
              to: payload.to,
            });
            break;
          case "PONG":
            // Take this as an opportunity to renew their subscriptions key,
            // so it'll expire an hour after they're last seen
            await REDIS.expire(
              `subscriptions:${sid}`,
              config.subscriptionLifetime
            );
            // PONG doesn't need a response
            break;
          default: {
            // @ts-expect-error payload.kind is `never` because this is an exhaustive switch
            const kind = payload.kind as string;
            logger.info("Unexpected WS message kind", { kind });
          }
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

    for (;;) {
      const data = await getEventChanges(logger, lastMid, 5_000);
      if (ws.readyState === ws.CLOSED) {
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
        logger.debug("MID is now " + msg.mid);
      }
    }
  });

  return router;
}
