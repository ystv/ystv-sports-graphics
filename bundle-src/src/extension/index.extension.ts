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

export = (nodecg: NodeCG) => {
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
  const eventIDRep = nodecg.Replicant<EventID>("eventID", {
    defaultValue: null,
  });
  const eventStateRep = nodecg.Replicant("eventState", {
    defaultValue: null as any,
  });

  let sid = "";
  let lastMID = "";

  const apiClient = axios.create({
    baseURL: config.scoresService.apiURL,
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
      cb!(e);
    }
  });

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

  function connect() {
    invariant(
      config.scoresService,
      "tried to connect with no scores service config"
    );
    const params: Record<string, string> = {};
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
    };
    ws.onmessage = (e) => {
      invariant(
        typeof e.data === "string",
        "non-string message from websocket"
      );
      const payload: LiveServerMessage = JSON.parse(e.data);
      nodecg.log.debug("WebSocket Message", payload.kind);
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
        default:
          // @ts-expect-error
          nodecg.log.warn("Unhandled WS message kind", payload.kind);
      }
    };
  }
  connect();
};
