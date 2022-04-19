import { ScoresServiceConnectionState } from "common/types/scoresServiceConnectionState";
import { IncomingMessage, ServerResponse } from "http";
import * as Prom from "prom-client";

const registry = new Prom.Registry();
Prom.collectDefaultMetrics({ register: registry });

export const handler = async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const metrics = await registry.metrics();
    res.writeHead(200, { "Content-Type": registry.contentType });
    res.end(metrics);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(e instanceof Error ? e.message : String(e));
  }
};

export const CONNECTION_STATE_TO_NUMBER: Record<
  ScoresServiceConnectionState,
  number
> = {
  NOT_CONNECTED: 0,
  WAITING: 1,
  SYNCHRONISING: 2,
  READY: 3,
  DISCONNECTED: -1,
};

export const gaugeServerConnectionState = new Prom.Gauge({
  name: "bundle_server_connection_state",
  help: "Server connection state: 0 = NOT_CONNECTED, 1 = WAITING, 2 = SYNCHRONISING, 3 = READY, -1 = DISCONNECTED",
  registers: [registry],
});

export const counterWebSocketMessages = new Prom.Counter({
  name: "bundle_ws_messages_total",
  help: "Total number of WebSocket messages received",
  registers: [registry],
  labelNames: ["kind"],
});

export const counterWebSocketErrors = new Prom.Counter({
  name: "bundle_ws_errors_total",
  help: "Total number of WebSocket errors",
  registers: [registry],
});

export const counterHttpResponses = new Prom.Counter({
  name: "bundle_http_responses_total",
  help: "Total number of HTTP responses received from the API, by code",
  registers: [registry],
  labelNames: ["status"],
});
