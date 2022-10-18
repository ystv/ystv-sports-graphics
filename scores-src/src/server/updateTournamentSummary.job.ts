// import cfg from "./config";
// import Queue from "bull";
import { DB } from "./db";
import { Action, EventMeta } from "../common/types";
import { invariant } from "./errs";
import { Logger } from "winston";
import { identity } from "lodash-es";
import { wrapReducer } from "../common/eventStateHelpers";
import { EVENT_TYPES } from "../common/sports";

export interface LeagueSummary {
  totalPointsHome: number;
  totalPointsAway: number;
  latestResults: Array<{
    eventType: string;
    name: string;
    winner: "home" | "away";
    points: number;
  }>;
}

// export const updateTournamentSummaryQueue = new Queue(
//   "updateTournamentSummary",
//   cfg.redis.connectionString,
//   {
//     limiter: {
//       max: 1,
//       duration: 10 * 1000,
//     },
//   }
// );

// const baseLogger = getLogger("updateTournamentSummary");

export async function doUpdate(logger: Logger, league: string) {
  const result: LeagueSummary = {
    latestResults: [],
    totalPointsAway: 0,
    totalPointsHome: 0,
  };

  const allEventResult = await DB.query(
    `SELECT e AS data, meta().id AS id
    FROM _default e
    WHERE meta(e).id LIKE 'EventMeta/%'
    AND league = $1
    ORDER BY MILLIS(e.startTime)`,
    {
      parameters: [league],
    }
  );
  logger.debug("Processsing", { league, len: allEventResult.rows.length });
  for (const row of allEventResult.rows) {
    const { id, data: meta } = row as { id: string; data: EventMeta };
    if (!meta.winner) {
      logger.debug("Skipping event with no winner", { id });
      continue;
    }
    if (meta.winner === "home") {
      result.totalPointsHome += meta.worthPoints;
    } else if (meta.winner === "away") {
      result.totalPointsAway += meta.worthPoints;
    } else {
      invariant(false, "winner wasn't either home or away");
    }
    result.latestResults.push({
      eventType: meta.type,
      name: meta.name,
      points: meta.worthPoints,
      winner: meta.winner,
    });
    logger.debug("Computed", {
      id,
      winner: meta.winner,
      points: meta.worthPoints,
    });
  }
  await DB.collection("_default").upsert(`LeagueSummary/${league}`, result);
}

// updateTournamentSummaryQueue.process(async function (job) {
//   const logger = baseLogger.child({
//     id: job.id,
//   });
//   logger.info("Starting.");
//   await doUpdate(logger);
//   logger.info("Done.");
// });
