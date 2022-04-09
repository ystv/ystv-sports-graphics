import logging from "loglevel";
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
  await REDIS.connect();
  logger.debug(
    "Connected to Redis",
    (await REDIS.info("server")).split("\n")[1]
  );
}

export async function close() {
  await REDIS.disconnect();
  logger.info("Redis disconnected.");
}
