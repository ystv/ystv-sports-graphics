import * as logging from "./loggingSetup";
import {
  Bucket,
  Cluster,
  connect as cbConnect,
  IndexExistsError,
  Scope,
} from "couchbase";
import config from "./config";

const logger = logging.getLogger("db");

export let cluster: Cluster;
let bucket: Bucket;
export let DB: Scope = null as unknown as Scope;

const INDEXES = [
  "CREATE PRIMARY INDEX ON `%bucket`",
  "CREATE INDEX idx_events_byType ON `%bucket` (type, MILLIS(startTime)) WHERE meta().id LIKE 'EventMeta/%' OR meta().id LIKE 'EventHistory/%'",
  "CREATE INDEX idx_events_byHomeTeam ON `%bucket` (homeTeam.slug, homeTeam.crestAttachmentID) WHERE meta().id LIKE 'EventMeta/%'",
  "CREATE INDEX idx_events_byAwayTeam ON `%bucket` (awayTeam.slug, awayTeam.crestAttachmentID) WHERE meta().id LIKE 'EventMeta/%'",
  "CREATE INDEX idx_attachments ON `%bucket` (meta().xattrs.mimeType) WHERE meta().id LIKE 'Attachment/%'",
  "CREATE INDEX idx_teams ON `%bucket` (slug) WHERE meta().id LIKE 'Team/%'",
];

export async function connect() {
  logger.info("Connecting to DB", {
    connectionString: config.db.connectionString,
  });
  cluster = await cbConnect(config.db.connectionString, {
    username: config.db.username,
    password: config.db.password,
  });
  logger.debug("DB connection established, pinging...");
  const pingResult = await cluster.ping();
  logger.debug("Ping successful.", { pingResult });
  bucket = cluster.bucket(config.db.bucket);
  DB = bucket.scope(config.db.scope);

  logger.debug("Creating query indexes...");
  let created = 0;
  for (const index of INDEXES) {
    try {
      await cluster.query(index.replace("%bucket", bucket.name));
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
    logger.info("Building newly created indexes...");
    await cluster.queryIndexes().buildDeferredIndexes(bucket.name);
  }

  logger.info("Database setup complete.");
}

export async function disconnect() {
  logger.info("Disconnecting DB.");
  await cluster.close();
}
