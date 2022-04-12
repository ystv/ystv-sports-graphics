import logging from "loglevel";
import { useRef, useEffect, useState } from "react";
import type {
  LiveClientMessage,
  LiveServerMessage,
} from "../../common/liveTypes";
import invariant from "tiny-invariant";
import { stringify as stringifyQS } from "qs";
const logger = logging.getLogger("liveData");
logger.setLevel(import.meta.env.DEV ? "trace" : "info");

export type LiveDataStatus =
  | "NOT_CONNECTED"
  | "CONNECTED"
  | "READY"
  | "POSSIBLY_DISCONNECTED";

export function useLiveData<T>(eventId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<LiveDataStatus>("NOT_CONNECTED");
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState<T | null>(null);

  const messageQueue = useRef<LiveClientMessage[]>([]);
  const sid = useRef<string | null>(null);
  const lastMid = useRef<string | null>(null);
  const lastPingAt = useRef<number>(0);
  const pingInterval = useRef<number | null>(null);

  function maybePing() {
    const PING_THRESHOLD_MS = 7_500;
    if (new Date().valueOf() - lastPingAt.current > PING_THRESHOLD_MS) {
      logger.info("Last ping was at", lastPingAt.current, "pinging now");
      setStatus("POSSIBLY_DISCONNECTED");
      send({ kind: "PING" });
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
    setStatus("READY");
    switch (payload.kind) {
      case "HELLO":
        sid.current = payload.sid;
        messageQueue.current.forEach((msg) => send(msg));
        messageQueue.current = [];
        break;
      case "SUBSCRIBE_OK":
        // @ts-expect-error typing this is impossible
        setValue(payload.current);
        break;
      case "UNSUBSCRIBE_OK":
        break;
      case "CHANGE":
        if (payload.changed !== latestEventId.current) {
          logger.debug("Ignoring unwanted change to", payload.changed);
          break;
        }

        // @ts-expect-error typing this is impossible
        setValue(payload.data);
        lastMid.current = payload.mid;
        break;
      case "ERROR":
        setError(payload.error);
        break;
      case "PING":
        send({ kind: "PONG" });
        break;
      case "PONG":
        break;
      default:
        // @ts-expect-error can receive anything at runtime
        invariant(false, "Unhandled message KIND " + payload.kind);
    }
  };

  function doConnect() {
    let url =
      (
        (import.meta.env.PUBLIC_API_BASE as string) ||
        window.location.origin + "/api"
      ).replace(/^http(s?):\/\//, "ws$1://") + "/updates/stream/v2";
    if (sid.current !== null && lastMid.current !== null) {
      url += stringifyQS(
        {
          sid: sid.current,
          last_mid: lastMid.current,
        },
        {
          addQueryPrefix: true,
        }
      );
    }
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

  return [value, status, error] as const;
}
