import logging from "loglevel";
import { useRef, useEffect, useState, useReducer, useMemo } from "react";
import type {
  LiveClientMessage,
  LiveServerMessage,
} from "../../common/liveTypes";
import invariant from "tiny-invariant";
import { stringify as stringifyQS } from "qs";
import { getAuthToken } from "./apiClient";
import { resolveEventState, wrapReducer } from "../../common/eventStateHelpers";
import { EVENT_TYPES } from "../../common/sports";
import { pick } from "lodash-es";
import { Action, EventMeta } from "../../common/types";

const logger = logging.getLogger("liveData");
logger.setLevel(import.meta.env.DEV ? "trace" : "info");

export type LiveDataStatus =
  | "NOT_CONNECTED"
  | "CONNECTED"
  | "READY"
  | "POSSIBLY_DISCONNECTED";

type AnyObject = Record<string, unknown>;

const historyReducer = (
  state: Action[] = [],
  action: Action | { type: "_resync"; history: Action[] }
) => {
  if (action.type === "_resync") {
    return (action as { history: Action[] }).history as Action[];
  }
  return [...state, action] as Action[];
};

export function useLiveData(eventId: string) {
  const [_, _2, type] = eventId.split("/");
  invariant(type, "eventId must be of the form 'Event/<type>/<id>'");
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<LiveDataStatus>("NOT_CONNECTED");
  const [error, setError] = useState<string | null>(null);
  const [history, addToHistory] = useReducer(historyReducer, []);
  const state = useMemo(
    () =>
      history.length === 0
        ? null
        : (resolveEventState(EVENT_TYPES[type].reducer, history) as EventMeta),
    [history, type]
  );

  const messageQueue = useRef<LiveClientMessage[]>([]);
  const sid = useRef<string | null>(null);
  const lastMid = useRef<string | null>(null);
  const lastPingAt = useRef<number>(0);
  const pingInterval = useRef<number | null>(null);
  const missedPings = useRef<number>(0);

  function maybePing() {
    const PING_THRESHOLD_MS = 7_500;
    if (new Date().valueOf() - lastPingAt.current > PING_THRESHOLD_MS) {
      logger.info("Last ping was at", lastPingAt.current, "pinging now");
      send({ kind: "PING" });
      missedPings.current++;
      if (missedPings.current >= 2) {
        setStatus("POSSIBLY_DISCONNECTED");
      }
    }
  }

  // This is necessary because we need it inside onMessage, which is a closure,
  // which captures the initial value
  const latestEventId = useRef<string>(eventId);
  useEffect(() => {
    latestEventId.current = eventId;
  }, [eventId]);

  function send(data: LiveClientMessage) {
    invariant(wsRef.current !== null, "tried to send with a null websocket");
    invariant(
      wsRef.current.readyState === WebSocket.OPEN,
      "tried to send with a non-open websocket"
    );
    wsRef.current.send(JSON.stringify(data));
  }
  function sendOrEnqueue(data: LiveClientMessage) {
    if (status === "CONNECTED" || status === "READY") {
      invariant(wsRef.current !== null, "ready=true but wsRef=null");
      send(data);
      return;
    }
    messageQueue.current.push(data);
  }

  const handleMessage = (ev: MessageEvent<unknown>) => {
    invariant(
      typeof ev.data === "string",
      "got a websocket message with data type " +
        typeof ev.data +
        ", expected string"
    );
    let payload: LiveServerMessage;
    try {
      payload = JSON.parse(ev.data);
    } catch (e) {
      logger.error("WS gave invalid JSON", e);
      return;
    }
    invariant(
      typeof payload.kind === "string",
      "got a websocket message with a non-string kind"
    );
    logger.debug("WS", payload.kind);
    lastPingAt.current = new Date().valueOf();
    missedPings.current = 0;
    setStatus("READY");
    switch (payload.kind) {
      case "HELLO":
        sid.current = payload.sid;
        messageQueue.current.forEach((msg) => send(msg));
        messageQueue.current = [];
        break;
      case "SUBSCRIBE_OK": {
        invariant(
          Array.isArray(payload.current),
          "received non-array current in SUBSCRIBE_OK"
        );
        const history = payload.current;
        addToHistory({ type: "_resync", history: history });
        break;
      }
      case "UNSUBSCRIBE_OK":
        break;
      case "ACTION": {
        if (payload.event !== latestEventId.current) {
          logger.debug("Ignoring unwanted change to", payload.event);
          break;
        }
        logger.debug("Received action, applying", payload.type);

        const action = pick(payload, "type", "payload", "meta");

        addToHistory(action);
        lastMid.current = payload.mid;
        break;
      }
      case "BULK_ACTIONS":
        if (payload.event !== latestEventId.current) {
          logger.debug("Ignoring unwanted change to", payload.event);
          break;
        }
        addToHistory({ type: "_resync", history: payload.actions });
        break;
      case "ERROR":
        setError(payload.error);
        break;
      case "PING":
        send({ kind: "PONG" });
        break;
      case "PONG":
        break;
      case "CHANGE":
        logger.warn("Received CHANGE - we're in actions-mode");
        break;
      default:
        // @ts-expect-error can receive anything at runtime
        invariant(false, "Unhandled message KIND " + payload.kind);
    }
  };

  function doConnect() {
    const token = getAuthToken();
    let url =
      (typeof import.meta.env.PUBLIC_API_BASE === "string"
        ? new URL(
            import.meta.env.PUBLIC_API_BASE,
            window.location.origin
          ).toString()
        : window.location.origin + "/api"
      ).replace(/^http(s?):\/\//, "ws$1://") + "/updates/stream/v2";

    const queryInfo: Record<string, string> = {
      mode: "actions",
    };
    if (token) {
      queryInfo.token = token;
    }

    if (sid.current !== null && lastMid.current !== null) {
      queryInfo.sid = sid.current;
      queryInfo.last_mid = lastMid.current;
    }

    url += stringifyQS(queryInfo, {
      addQueryPrefix: true,
    });

    wsRef.current = new WebSocket(url);
    wsRef.current.onopen = () => {
      logger.info("WS open");
      setStatus("CONNECTED");
      pingInterval.current = window.setInterval(() => {
        maybePing();
      }, 5000);
    };
    wsRef.current.onclose = (ev) => {
      const delay = 1000 + 1000 * Math.random();
      logger.info("WS close with reason", ev.code, "reconnecting in", delay);
      if (pingInterval.current !== null) {
        window.clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
      setStatus("NOT_CONNECTED");
      setTimeout(() => {
        doConnect();
      }, delay);
    };
    wsRef.current.onerror = (ev) => {
      logger.error("WS error", ev);
    };
    wsRef.current.onmessage = handleMessage;
  }

  useEffect(() => {
    doConnect();

    return () => {
      setStatus("NOT_CONNECTED");
      if (
        wsRef.current !== null &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        logger.info("Unmounting, closing websocket");
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    sendOrEnqueue({
      kind: "SUBSCRIBE",
      to: eventId,
    });
  }, [eventId]);

  return [state, history, status, error] as const;
}
