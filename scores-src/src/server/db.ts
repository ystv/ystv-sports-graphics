import logging from "loglevel";
import { Bucket, Cluster, connect as cbConnect, IndexExistsError, Scope } from "couchbase";
import config from "./config";

const logger = logging.getLogger("db");

let cluster: Cluster;
let bucket: Bucket;
export let DB: Scope = null as unknown as Scope;

const INDEXES = [
    'CREATE PRIMARY INDEX ON `%bucket`',
    'CREATE INDEX idx_events ON `%bucket` (meta().id, type) WHERE meta().id LIKE "Event/%"',
];

export async function connect() {
    logger.debug("Connecting to DB", config.db.connectionString);
    cluster = await cbConnect(config.db.connectionString, {
        username: config.db.username,
        password: config.db.password
    });
    logger.debug("DB connection established, pinging...");
    const pingResult = await cluster.ping();
    logger.debug("Ping successful.", pingResult);
    bucket = cluster.bucket(config.db.bucket);
    DB = bucket.scope(config.db.scope);

    logger.debug("Creating query indexes...");
    let created = 0;
    for (const index of INDEXES) {
        try {
            await cluster.query(index.replace('%bucket', bucket.name));
            created++;
        } catch (e) {
            if (e instanceof IndexExistsError) {
                continue;
            }
            throw e;
        }
    }
    logger.info(`Created ${created} indexes.`);
    if (created > 0) {
        logger.info("Building newly created indexes...")
        await cluster.queryIndexes().buildDeferredIndexes(bucket.name);
    }

    logger.debug("Database setup complete.")
}

export async function disconnect() {
    logger.info("Disconnecting DB.");
    await cluster.close();
}
