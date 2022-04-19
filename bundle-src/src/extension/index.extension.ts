import type { Configschema } from "common/types/config";
import type { NodeCG } from "../../../../../types/server";
import { WebSocket } from "ws";
import type { ScoresServiceConnectionState } from "common/types/scoresServiceConnectionState";
import invariant from "tiny-invariant";
import type {
  LiveClientMessage,
  LiveServerMessage,
} from "@ystv/scores/src/common/liveTypes";
import type { EventID } from "common/types/eventID";
import qs from "qs";
import axios from "axios";
import { UnhandledListenForCb } from "../../../../../types/lib/nodecg-instance";
import { Request, Response } from "express-serve-static-core";
import * as metrics from "./metrics";

export = async (nodecg: NodeCG) => {
  const config: Configschema = nodecg.bundleConfig;
  if (!config.scoresService) {
    nodecg.log.warn("Scores service not configured!");
    return;
  }

  const stateRep = nodecg.Replicant<ScoresServiceConnectionState>(
    "scoresServiceConnectionState",
    {
      defaultValue: "NOT_CONNECTED",
    }
  );
  stateRep.on("change", (val) => {
    metrics.gaugeServerConnectionState.set(
      metrics.CONNECTION_STATE_TO_NUMBER[val]
    );
  });
  const eventIDRep = nodecg.Replicant<EventID>("eventID", {
    defaultValue: null,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventStateRep = nodecg.Replicant<any>("eventState", {
    defaultValue: null,
  });

  const router = nodecg.Router();
  router.get("/healthz", (_: Request, res: Response) => {
    if (
      stateRep.value === "DISCONNECTED" ||
      stateRep.value === "NOT_CONNECTED"
    ) {
      res.status(503).send("state: " + stateRep.value);
    } else {
      res.status(200).send("state: " + stateRep.value);
    }
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get("/metrics", metrics.handler as any);
  nodecg.mount("/ystv-sports-graphics", router);

  let sid = "";
  let lastMID = "";
  let token = "";

  const apiClient = axios.create({
    baseURL: config.scoresService.apiURL,
    withCredentials: true,
    auth: {
      username: config.scoresService.username,
      password: config.scoresService.password,
    },
    validateStatus(status) {
      metrics.counterHttpResponses.labels(status.toString()).inc();
      return status >= 200 && status < 300;
    },
  });

  nodecg.listenFor("list-events", async (_, cb_) => {
    nodecg.log.info("list-events");
    const cb = cb_ as UnhandledListenForCb;
    try {
      const result = await apiClient.get("/events");
      nodecg.log.trace("LE response", result.data);
      cb(null, result.data);
    } catch (e) {
      nodecg.log.error("LE error", e);
      cb(e);
    }
  });

  nodecg.log.debug("Authenticating...");
  const authResponse = await apiClient.post("/auth/login/local", {
    username: config.scoresService.username,
    password: config.scoresService.password,
  });
  token = authResponse.data.token;
  nodecg.log.debug("Authenticated successfully.");

  let ws: WebSocket | null = null;
  let subscribedId: string | null = null;

  function send(data: LiveClientMessage) {
    invariant(ws !== null, "tried to send with null WebSocket");
    invariant(
      ws.readyState === ws.OPEN,
      "tried to send with a closed WebSocket"
    );
    nodecg.log.debug("WebSocket sending", data.kind);
    ws.send(JSON.stringify(data), (err) => {
      if (err) {
        nodecg.log.error("WebSocket failed to send", data.kind, err);
      }
    });
  }

  function maybeResubscribe() {
    if (ws === null) {
      nodecg.log.warn("MR: called when ws was still null!");
      return;
    }
    if (ws.readyState !== ws.OPEN) {
      nodecg.log.warn("MR: called when ws was not open!");
      return;
    }
    if (subscribedId === eventIDRep.value) {
      nodecg.log.debug("MR: Already subscribed to correct ID");
      // To avoid confusing users, set state to READY if we don't want an event
      if (subscribedId === null) {
        stateRep.value = "READY";
      } else {
        // Resync if we do want one though
        send({
          kind: "RESYNC",
          what: subscribedId,
        });
      }
      return;
    }
    if (subscribedId !== null && eventIDRep.value !== subscribedId) {
      nodecg.log.debug("MR: Want unsubscribe");
      send({
        kind: "UNSUBSCRIBE",
        to: subscribedId,
      });
    }
    if (eventIDRep.value !== null && eventIDRep.value !== subscribedId) {
      nodecg.log.debug("MR: want subscribe", eventIDRep.value);
      send({
        kind: "SUBSCRIBE",
        to: eventIDRep.value,
      });
    }
  }

  eventIDRep.on("change", (val) => {
    nodecg.log.debug("eventID change", val);
    maybeResubscribe();
  });

  nodecg.listenFor("resync", () => {
    if (eventIDRep.value === null) {
      nodecg.log.warn("Tried to resync with no eventID");
      return;
    }
    try {
      send({
        kind: "RESYNC",
        what: eventIDRep.value,
      });
    } catch (e) {
      nodecg.log.error("Resync failed", e);
    }
  });

  function connect() {
    invariant(
      config.scoresService,
      "tried to connect with no scores service config"
    );
    const params: Record<string, string> = {
      token,
      mode: "state",
    };
    if (sid.length > 0) {
      params.sid = sid;
    }
    if (lastMID.length > 0) {
      params.last_mid = lastMID;
    }
    const apiURL =
      config.scoresService.apiURL.replace(/^http(s?):\/\//, "ws$1://") +
      "/updates/stream/v2" +
      qs.stringify(params, {
        addQueryPrefix: true,
      });
    nodecg.log.debug("Connecting WebSocket on", apiURL);
    ws = new WebSocket(apiURL);
    ws.onopen = () => {
      nodecg.log.debug("WebSocket Open");
      stateRep.value = "WAITING";
    };
    ws.onclose = () => {
      nodecg.log.debug("WebSocket Close");
      stateRep.value = "DISCONNECTED";
      const reconnectIn = Math.random() * 3000 + 1000;
      nodecg.log.debug("Reconnecting in", reconnectIn);
      setTimeout(() => connect(), reconnectIn);
    };
    ws.onerror = (e: unknown) => {
      nodecg.log.error("WebSocket Error", e);
      metrics.counterWebSocketErrors.inc();
    };
    ws.onmessage = (e) => {
      invariant(
        typeof e.data === "string",
        "non-string message from websocket"
      );
      const payload: LiveServerMessage = JSON.parse(e.data);
      nodecg.log.debug("WebSocket Message", payload.kind);
      metrics.counterWebSocketMessages.labels(payload.kind).inc();
      switch (payload.kind) {
        case "HELLO":
          sid = payload.sid;
          stateRep.value = "SYNCHRONISING";
          if (payload.subs.length > 0) {
            subscribedId = payload.subs[0];
          } else {
            subscribedId = null;
          }
          maybeResubscribe();
          break;
        case "SUBSCRIBE_OK":
          stateRep.value = "READY";
          subscribedId = payload.to;
          eventStateRep.value = payload.current;
          nodecg.log.debug("event state now", eventStateRep.value);
          break;
        case "UNSUBSCRIBE_OK":
          if (payload.to !== subscribedId) {
            nodecg.log.warn(
              "Received UNSUBSCRIBE_OK for unexpected ID - expected",
              subscribedId,
              "actual",
              payload.to
            );
          }
          subscribedId = null;
          break;
        case "CHANGE":
          eventStateRep.value = payload.data;
          lastMID = payload.mid;
          nodecg.log.debug("event state now", eventStateRep.value);
          // Could end up here if we were already subscribed and did a resync
          if (stateRep.value === "SYNCHRONISING") {
            stateRep.value = "READY";
          }
          break;
        case "ERROR":
          nodecg.log.warn("Server-side error", payload.error);
          break;
        case "PING":
          send({
            kind: "PONG",
          });
          break;
        case "PONG":
          break;
        case "ACTION":
        case "BULK_ACTIONS":
        // Fall through - we're always in state-mode, so shouldn't receive any action-mode messages
        default:
          nodecg.log.warn("Unhandled WS message kind", payload.kind);
      }
    };
  }
  connect();
};
