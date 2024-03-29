import "express-ws";
import type * as ws from "ws";
import { REDIS } from "./redis";
import * as logging from "./loggingSetup";
import { BadRequest } from "http-errors";
import { randomUUID } from "crypto";
import { EventUpdateMessage, getActions, SpecialMessage } from "./updatesRepo";
import { ensure } from "./errs";
import { DB } from "./db";
import { DocumentNotFoundError } from "couchbase";
import type { LiveClientMessage, LiveServerMessage } from "../common/liveTypes";
import config from "./config";
import { Request, Router } from "express";
import { activeStreamConnections } from "./metrics";
import { verifySessionID } from "./auth";
import { URLSearchParams } from "url";
import { resolveEventState } from "../common/eventStateHelpers";
import invariant from "tiny-invariant";
import { EVENT_TYPES } from "../common/sports";
import { Action } from "../common/types";
import { ClientClosedError } from "redis";

type SocketMode = "actions" | "state";

function generateSid(): string {
  return randomUUID();
}

class UserError extends Error {}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createLiveRouter() {
  const router = Router();
  router.ws(`/updates/stream/v2`, async function (ws: ws, req: Request) {
    logging.getLogger("live").info("Received WS connection", {
      remote: req.ip + ":" + req.socket.remotePort,
      sid: req.query.sid,
      last_mid: req.query.last_mid,
      mode: req.query.mode ?? "state",
    });
    activeStreamConnections.inc();

    const sid: { current: string } = { current: "INVALID" };
    if ("sid" in req.query) {
      ensure(typeof req.query.sid === "string", BadRequest, "invalid sid type");
      sid.current = req.query.sid;
    }

    const mode = (req.query.mode as SocketMode) ?? "state";

    let logger = logging.getLogger(`live`).child({ sid: sid.current, mode });

    const url = new URL(req.originalUrl, `http://ystv.internal`);
    const query = new URLSearchParams(url.search);
    const token = query.get("token");
    if (token === null) {
      logger.info("Rejecting because no token was given");
      ws.close(1008);
      return;
    }
    try {
      await verifySessionID(token, ["read"]);
    } catch (e) {
      logger.info("Rejecting because the token was invalid");
      ws.close(1008);
      return;
    }

    const subs = new Set<string>(
      await REDIS.sMembers(`subscriptions:${sid.current}`)
    );
    if (subs.size === 0) {
      // Reset the SID to signal to the client that they've lost their subscriptions
      sid.current = generateSid();
      logger = logging.getLogger(`live`).child({ sid: sid.current, mode });
    }

    // Only declare send() now, to ensure it doesn't capture a logger with stale metadata
    // TODO (GRAPHICS-193): we still get many logs with sid=INVALID
    function send(msg: LiveServerMessage) {
      return new Promise<void>((resolve, reject) => {
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
            reject(meta);
          } else {
            logger.silly("WS sent", { kind: msg.kind });
            resolve();
          }
        });
      });
    }

    ws.on("close", (code: number, reason: Buffer) => {
      logger.info("WebSocket closed", { code, reason });
      activeStreamConnections.dec();
    });

    ws.on("error", (err) => {
      logger.warn("WebSocket error", { error: err });
    });

    logger.debug("HELLO");
    await send({
      kind: "HELLO",
      sid: sid.current,
      subs: Array.from(subs),
      mode,
    });

    const historyCache = new Map<string, Action[]>();

    async function calculateAndSendCurrentState(
      fullyQualifiedId: string,
      mid?: string
    ) {
      const idParts = fullyQualifiedId.split("/");
      invariant(idParts.length === 4, "cASCS: invalid FQID!");
      const [_, _2, eventType] = idParts;
      const history = historyCache.get(fullyQualifiedId);
      invariant(Array.isArray(history), "cASCS: no history");
      const state = resolveEventState(EVENT_TYPES[eventType].reducer, history);
      await send({
        kind: "CHANGE",
        changed: fullyQualifiedId,
        mid: mid ?? lastMid,
        data: state,
      });
    }

    async function handleSpecial(mid: string, data: SpecialMessage) {
      switch (data._special) {
        case "resync": {
          // Throw away the cache, get the state from the DB, and send it off
          if (!subs.has(data.id)) {
            return;
          }
          logger.debug("Processing resync", { id: data.id });
          const history = (
            await DB.collection("_default").get(
              data.id.replace("Event/", "EventHistory/")
            )
          ).content;
          historyCache.set(data.id, history);
          if (mode === "state") {
            await calculateAndSendCurrentState(data.id);
          } else {
            await send({
              kind: "BULK_ACTIONS",
              event: data.id,
              actions: history,
            });
          }
          logger.info("Resync processed", { id: data.id });
          break;
        }
        default:
          invariant(false, `unknown special message ${data._special}`);
      }
    }

    async function handleAction(mid: string, data: EventUpdateMessage) {
      let history = historyCache.get(data.id);
      if (history) {
        history.push({
          type: data.type,
          payload: JSON.parse(data.payload || "{}"),
          meta: JSON.parse(data.meta),
        });
      } else {
        history = (
          await DB.collection("_default").get(
            data.id.replace("Event/", "EventHistory/")
          )
        ).content;
        invariant(
          typeof history !== "undefined",
          "history undefined even after DB get"
        );
      }

      logger.debug("handleAction: history updated", {
        latest: history[history.length - 1],
        len: history.length,
        payload: data.payload,
      });
      historyCache.set(data.id, history);
      if (mode === "state") {
        await calculateAndSendCurrentState(data.id, mid);
      } else {
        await send({
          kind: "ACTION",
          mid,
          event: data.id,
          type: data.type,
          payload: JSON.parse(data.payload || "{}"),
          meta: JSON.parse(data.meta),
        });
      }
    }

    let lastMid: string;

    if ("last_mid" in req.query) {
      ensure(
        typeof req.query.last_mid === "string",
        BadRequest,
        "invalid last_mid type"
      );
      lastMid = req.query.last_mid;
      for (;;) {
        const data = await getActions(logger, lastMid);
        if (data === null || data.length === 0) {
          logger.debug("Caught up, continuing");
          break;
        }
        logger.debug("Catch-up: got data", { len: data.length });
        for (const msg of data) {
          // Skip special messages for the purposes of catch-up - but ensure we
          // always update lastMid, lest we go into a loop!
          lastMid = msg.mid;
          logger.debug("Catch-up: last MID now " + lastMid);
          if ("_special" in msg.data) {
            continue;
          }
          if (subs.has(msg.data.id)) {
            handleAction(msg.mid, msg.data);
          }
        }
      }
    } else {
      // Setting the MID to the current time means that Redis will send us all messages
      // from now. Note that we do NOT use $, because that could result in us losing
      // messages that come in while we're disconnected (which happens every 5 seconds)!
      lastMid = new Date().valueOf().toString(10);
    }

    ws.on("message", async (msg) => {
      try {
        ensure(typeof msg === "string", UserError, "non-string message");
        const payload: LiveClientMessage = JSON.parse(msg);
        logger.silly("WS recv", payload);

        switch (payload.kind) {
          case "SUBSCRIBE": {
            ensure(
              typeof payload.to === "string",
              UserError,
              "invalid 'to' type"
            );
            const idParts = payload.to.split("/");
            ensure(idParts.length === 4, UserError, "invalid 'to' format");
            const [_, league, eventType, eventId] = idParts;
            subs.add(payload.to);
            await REDIS.sAdd(`subscriptions:${sid.current}`, payload.to);
            await REDIS.expire(
              `subscriptions:${sid.current}`,
              config.subscriptionLifetime
            );

            let currentHistory;
            try {
              currentHistory = (
                await DB.collection("_default").get(
                  `EventHistory/${league}/${eventType}/${eventId}`
                )
              ).content;
            } catch (e) {
              logger.warn("In SUBSCRIBE handler, failed to fetch history", {
                err: e,
              });
              if (e instanceof DocumentNotFoundError) {
                currentHistory = [];
              } else {
                throw e;
              }
            }
            await send({
              kind: "SUBSCRIBE_OK",
              to: payload.to,
              current:
                mode === "actions"
                  ? currentHistory
                  : resolveEventState(
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
            await REDIS.sRem(`subscriptions:${sid.current}`, payload.to);
            await send({
              kind: "UNSUBSCRIBE_OK",
              to: payload.to,
            });
            break;

          case "RESYNC": {
            // Throw away the cache, get the state from the DB, and send it off
            ensure(
              subs.has(payload.what),
              UserError,
              "can't resync not subscribed event"
            );
            const history = (
              await DB.collection("_default").get(
                payload.what.replace("Event/", "EventHistory/")
              )
            ).content;
            historyCache.set(payload.what, history);
            if (mode === "state") {
              calculateAndSendCurrentState(payload.what);
            } else {
              await send({
                kind: "BULK_ACTIONS",
                event: payload.what,
                actions: history,
              });
            }
            break;
          }

          case "PING":
            await send({ kind: "PONG" });
          // fall through

          case "PONG":
            // Take this as an opportunity to renew their subscriptions key,
            // so it'll expire an hour after they're last seen
            await REDIS.expire(
              `subscriptions:${sid.current}`,
              config.subscriptionLifetime
            );
            // PONG doesn't need a response
            break;

          default: {
            // @ts-expect-error payload.kind is `never` because this is an exhaustive switch (if it isn't, we've missed a message kind!)
            const kind = payload.kind as string;
            logger.info("Unexpected WS message kind", { kind });
          }
        }
      } catch (e) {
        let msg: string;
        if (e instanceof UserError) {
          logger.info("User error", { error: e.message });
          msg = e.message;
        } else if (e instanceof Error) {
          logger.error("OnMessage error", {
            error: e.name,
            message: e.message,
            stack: e.stack,
          });
          msg = e.name + " " + e.message;
          logger;
        } else {
          logger.error("OnMessage error", { error: e });
          msg = JSON.stringify(e);
        }
        await send({
          kind: "ERROR",
          error: msg,
        });
      }
    });

    for (;;) {
      let data;
      try {
        data = await getActions(logger, lastMid, 5_000);
      } catch (e) {
        let meta;
        if (e instanceof Error) {
          meta = { name: e.name, message: e.message, stack: e.stack };
        } else {
          meta = JSON.stringify(e);
        }
        logger.error("Redis error", { error: meta });
        if (ws.readyState === ws.CLOSED) {
          break;
        } else if (e instanceof ClientClosedError) {
          await send({
            kind: "ERROR",
            error: "Redis connection closed - this is probably a bug",
          });
          break;
        } else {
          await sleep(500);
          continue;
        }
      }
      if (ws.readyState === ws.CLOSED) {
        logger.info("WebSocket state is CLOSED, ending Redis loop.");
        return;
      }
      if (data === null) {
        await send({ kind: "PING" });
        continue;
      }
      for (const msg of data) {
        if ("_special" in msg.data) {
          handleSpecial(msg.mid, msg.data);
        } else if (subs.has(msg.data.id)) {
          handleAction(msg.mid, msg.data);
        }
        lastMid = msg.mid;
        logger.debug("MID is now " + msg.mid);
      }
    }
  });

  return router;
}
