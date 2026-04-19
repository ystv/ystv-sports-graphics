// import cfg from "./config";
// import Queue from "bull";
import { invariant } from "./errs";
import { Logger } from "winston";
import { identity } from "lodash-es";
import { wrapReducer } from "../common/eventStateHelpers";
import { EVENT_TYPES } from "../common/sports";
import { db } from "./db";
import { EventMeta, LeagueSummary } from "../generated/prisma/client";

// export interface LeagueSummary {
//   totalPointsHome: number;
//   totalPointsAway: number;
//   latestResults: Array<LatestResult>;
// }

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
  const result: Omit<LeagueSummary, "id"> = {
    latestResults: [],
    totalPointsAway: 0,
    totalPointsHome: 0,
  };

  const allEventResult = await db.eventMeta.findMany({
    where: {
      league,
    },
    orderBy: {
      startTime: "asc",
    },
  });
  logger.debug("Processsing", { league, len: allEventResult.length });
  for (const row of allEventResult) {
    // const { id, data: meta } = row as { id: string; ...data: EventMeta };
    const id = row.id;
    if (!row.winner) {
      logger.debug("Skipping event with no winner", { id });
      continue;
    }
    if (row.winner === "home") {
      result.totalPointsHome += row.worthPoints;
    } else if (row.winner === "away") {
      result.totalPointsAway += row.worthPoints;
    } else {
      invariant(false, "winner wasn't either home or away");
    }
    result.latestResults.push({
      eventType: row.type,
      name: row.name,
      points: row.worthPoints,
      winner: row.winner,
    });
    logger.debug("Computed", {
      id,
      winner: row.winner,
      points: row.worthPoints,
    });
  }
  await db.leagueSummary.upsert({
    where: {
      id: league,
    },
    create: {
      league: { connect: { slug: league } },
      ...result,
    },
    update: {
      ...result,
    },
  });
}

// updateTournamentSummaryQueue.process(async function (job) {
//   const logger = baseLogger.child({
//     id: job.id,
//   });
//   logger.info("Starting.");
//   await doUpdate(logger);
//   logger.info("Done.");
// });
