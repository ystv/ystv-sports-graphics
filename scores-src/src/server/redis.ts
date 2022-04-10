import * as logging from "./loggingSetup";
import { RedisClientType } from "@node-redis/client";
import { createClient } from "redis";
import config from "./config";

const logger = logging.getLogger("redis");

export let REDIS: RedisClientType;

export async function connect() {
  logger.debug("Connecting...");
  REDIS = createClient({
    url: config.redis.connectionString,
  });
  REDIS.on("error", (err) => {
    logger.warn("Lost connection!", { error: err });
  });
  await REDIS.connect();
  logger.debug("Connected to Redis", {
    version: (await REDIS.info("server")).split("\r\n")[1],
  });
}

export async function close() {
  await REDIS.disconnect();
  logger.info("Redis disconnected.");
}
