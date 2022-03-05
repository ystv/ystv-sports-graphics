import logging from "loglevel";
import { useRef, useEffect, useState } from "react";
import type {
  LiveClientMessage,
  LiveServerMessage,
} from "../../common/liveTypes";
import invariant from "tiny-invariant";
import { stringify as stringifyQS } from "qs";
const logger = logging.getLogger("liveData");

export function useLiveData<T>(eventId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState<T | null>(null);

  const messageQueue = useRef<LiveClientMessage[]>([]);
  const sid = useRef<string | null>(null);
  const lastMid = useRef<string | null>(null);

  function send(data: LiveClientMessage) {
    invariant(wsRef.current !== null, "tried to send with a null websocket");
    wsRef.current.send(JSON.stringify(data));
  }
  function sendOrEnqueue(data: LiveClientMessage) {
    if (ready) {
      invariant(wsRef.current !== null, "ready=true but wsRef=null");
      send(data);
      return;
    }
    messageQueue.current.push(data);
  }

  useEffect(() => {
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
    };
    wsRef.current.onclose = (ev) => {
      logger.info("WS close with reason", ev.code);
      setReady(false);
    };
    wsRef.current.onerror = (ev) => {
      logger.error("WS error", ev);
      setReady(false);
      wsRef.current = new WebSocket(url);
    };
    wsRef.current.onmessage = (ev) => {
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
      switch (payload.kind) {
        case "HELLO":
          sid.current = payload.sid;
          setReady(true);
          messageQueue.current.forEach((msg) => send(msg));
          messageQueue.current = [];
          break;
        case "SUBSCRIBE_OK":
          setValue(payload.current as any);
          break;
        case "UNSUBSCRIBE_OK":
          break;
        case "CHANGE":
          setValue(payload.data as any);
          lastMid.current = payload.mid;
          break;
        case "ERROR":
          setError(payload.error);
          break;
        default:
          invariant(false, "Unhandled message KIND" + (payload as any).kind);
      }
    };

    return () => {
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
    return () => {
      sendOrEnqueue({
        kind: "UNSUBSCRIBE",
        to: eventId,
      });
    };
  }, [eventId]);

  return [value, ready, error] as const;
}
