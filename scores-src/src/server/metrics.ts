import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import {
  Registry,
  collectDefaultMetrics,
  Histogram,
  Counter,
  Gauge,
} from "prom-client";

const reg = new Registry();
collectDefaultMetrics({
  register: reg,
});

export const httpRequestDurationSeconds = new Histogram({
  name: "http_request_duration_seconds",
  help: "Histogram of HTTP request duration in seconds",
  labelNames: ["method", "path"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.5, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
reg.registerMetric(httpRequestDurationSeconds);

export const httpResponseStatus = new Counter({
  name: "http_response_status",
  help: "Number of HTTP requests by method, path, and response code",
  labelNames: ["method", "path", "code"],
});
reg.registerMetric(httpResponseStatus);

export const activeStreamConnections = new Gauge({
  name: "active_stream_connections",
  help: "Numer of clients currently connected to the streaming updates endpoint",
});
reg.registerMetric(activeStreamConnections);

export const metricsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const metrics = await reg.metrics();
    res
      .status(200)
      .header("Content-Type", "text/plain; version=0.0.4")
      .send(metrics);
  }
);
