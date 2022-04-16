import "express-ws";
import type * as ws from "ws";
import { REDIS } from "./redis";
import * as logging from "./loggingSetup";
import { BadRequest } from "http-errors";
import { randomUUID } from "crypto";
import { getActions, UpdatesMessage } from "./updatesRepo";
import { ensure } from "./errs";
import { DB } from "./db";
import { DocumentNotFoundError, User } from "couchbase";
import type { LiveClientMessage, LiveServerMessage } from "../common/liveTypes";
import config from "./config";
import { Request, Router } from "express";
import { activeStreamConnections } from "./metrics";
import { verifySessionID } from "./auth";
import { URLSearchParams } from "url";
import { Action, resolveEventState } from "../common/eventStateHelpers";
import invariant from "tiny-invariant";
import { EVENT_TYPES } from "../common/sports";

function generateSid(): string {
  return randomUUID();
}

class UserError extends Error {}

export function createLiveRouter() {
  const router = Router();
  router.ws(`/updates/stream/v2`, async function (ws: ws, req: Request) {
    logging.getLogger("live").info("Received WS connection", {
      remote: req.ip + ":" + req.socket.remotePort,
      sid: req.query.sid,
      last_mid: req.query.last_mid,
    });
    activeStreamConnections.inc();

    const sid: { current: string } = { current: "INVALID" };
    if ("sid" in req.query) {
      ensure(typeof req.query.sid === "string", BadRequest, "invalid sid type");
      sid.current = req.query.sid;
    }

    let logger = logging.getLogger(`live`).child({ sid: sid.current });

    const url = new URL(req.originalUrl, `http://ystv.internal`);
    const query = new URLSearchParams(url.search);
    const token = query.get("token");
    if (token === null) {
      logger.info("Rejecting because no token was given");
      ws.close(1008);
      return;
    }
    try {
      verifySessionID(token, ["read"]);
    } catch (e) {
      logger.info("Rejecting because the token was invalid");
      ws.close(1008);
      return;
    }

    function send(msg: LiveServerMessage) {
      ws.send(JSON.stringify(msg), (err) => {
        if (err) {
          let meta = {} as Record<string, string>;
          if (err instanceof Error) {
            meta = {
              name: err.name,
              message: err.message,
              stack: err.stack ?? "<none>",
            };
          } else {
            meta.err = JSON.stringify(err);
          }
          logger.error("WS send error", meta);
        } else {
          logger.debug("WS sent", { kind: msg.kind });
        }
      });
    }

    const subs = new Set<string>(await REDIS.sMembers(`subscriptions:${sid}`));
    if (subs.size === 0) {
      // Reset the SID to signal to the client that they've lost their subscriptions
      sid.current = generateSid();
      logger = logging.getLogger(`live`).child({ sid: sid.current });
    }

    ws.on("close", (code: number, reason: Buffer) => {
      logger.info("WebSocket closed", { code, reason });
      activeStreamConnections.dec();
    });

    ws.on("error", (err) => {
      logger.warn("WebSocket error", { error: err });
    });

    logger.debug("HELLO");
    send({
      kind: "HELLO",
      sid: sid.current,
      subs: Array.from(subs),
    });

    const historyCache = new Map<string, Action[]>();

    function calculateAndSendCurrentState(
      fullyQualifiedId: string,
      mid?: string
    ) {
      const idParts = fullyQualifiedId.split("/");
      invariant(idParts.length === 3, "dCTSD: invalid FQID!");
      const [_, eventType] = idParts;
      const history = historyCache.get(fullyQualifiedId);
      invariant(Array.isArray(history), "cASCS: no history");
      const state = resolveEventState(EVENT_TYPES[eventType].reducer, history);
      send({
        kind: "CHANGE",
        changed: fullyQualifiedId,
        mid: mid ?? lastMid,
        data: state,
      });
    }

    async function dispatchChangeToSubscribedData(
      mid: string,
      data: UpdatesMessage
    ) {
      let history = historyCache.get(data.id);
      if (history) {
        history.push({
          type: data.type,
          payload: JSON.parse(data.payload),
          meta: JSON.parse(data.meta),
        });
      } else {
        history = (await DB.collection("_default").get(data.id)).content;
        invariant(
          typeof history !== "undefined",
          "history undefined even after DB get"
        );
      }

      logger.debug("dCTSD: history updated", {
        latest: history[history.length - 1],
        len: history.length,
      });
      historyCache.set(data.id, history);
      calculateAndSendCurrentState(data.id, mid);
    }

    let lastMid = "$";

    if ("last_mid" in req.query) {
      ensure(
        typeof req.query.last_mid === "string",
        BadRequest,
        "invalid last_mid type"
      );
      logger.debug("Got a last_mid so catching up", {
        last_mid: req.query.last_mid,
      });
      lastMid = req.query.last_mid;
      for (;;) {
        const data = await getActions(logger, lastMid);
        if (data === null || data.length === 0) {
          logger.debug("Caught up, continuing");
          break;
        }
        logger.debug("Catch-up: got data", { len: data.length });
        for (const msg of data) {
          if (subs.has(msg.data.id)) {
            dispatchChangeToSubscribedData(msg.mid, msg.data);
          }
          lastMid = msg.mid;
          logger.debug("Catch-up: last MID now " + lastMid);
        }
      }
    }

    ws.on("message", async (msg) => {
      try {
        ensure(typeof msg === "string", UserError, "non-string message");
        const payload: LiveClientMessage = JSON.parse(msg);
        logger.debug("WS recv", { kind: payload.kind });
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
            const idParts = payload.to.split("/");
            ensure(idParts.length === 3, UserError, "invalid 'to' format");
            const [_, eventType] = idParts;
            subs.add(payload.to);
            await REDIS.sAdd(`subscriptions:${sid}`, payload.to);
            await REDIS.expire(
              `subscriptions:${sid}`,
              config.subscriptionLifetime
            );

            let currentHistory;
            try {
              currentHistory = (await DB.collection("_default").get(payload.to))
                .content;
            } catch (e) {
              if (e instanceof DocumentNotFoundError) {
                currentHistory = [];
              } else {
                throw e;
              }
            }
            send({
              kind: "SUBSCRIBE_OK",
              to: payload.to,
              current: resolveEventState(
                EVENT_TYPES[eventType].reducer,
                currentHistory
              ),
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
          case "RESYNC":
            // Throw away the cache, get the state from the DB, and send it off
            ensure(
              subs.has(payload.what),
              UserError,
              "can't resync not subscribed event"
            );
            historyCache.set(
              payload.what,
              (await DB.collection("_default").get(payload.what)).content
            );
            calculateAndSendCurrentState(payload.what);
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

    for (;;) {
      const data = await getActions(logger, lastMid, 5_000);
      if (ws.readyState === ws.CLOSED) {
        logger.info("WebSocket state is CLOSED, ending Redis loop.");
        return;
      }
      if (data === null) {
        // Redis has nothing to give us now, so we can replace the MID with $,
        // then next time round we'll get the latest
        lastMid = "$";
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
