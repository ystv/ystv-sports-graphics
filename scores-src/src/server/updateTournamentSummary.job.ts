// import cfg from "./config";
// import Queue from "bull";
import { DB } from "./db";
import { Action, BaseEventType } from "../common/types";
import { invariant } from "./errs";
import { Logger } from "winston";
import { identity } from "lodash-es";
import { wrapReducer } from "../common/eventStateHelpers";
import { EVENT_TYPES } from "../common/sports";

export interface TournamentSummary {
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

export async function doUpdate(logger: Logger) {
  const result: TournamentSummary = {
    latestResults: [],
    totalPointsAway: 0,
    totalPointsHome: 0,
  };

  const allEventResult = await DB.query(
    `SELECT e AS data, meta().id AS id
    FROM _default e
    WHERE meta(e).id LIKE 'Event/%'
    ORDER BY MILLIS(ARRAY_REVERSE(ARRAY x.payload.startTime FOR x IN e WHEN x.type = '@@init' OR x.type = '@@edit' END)[0])`
  );
  logger.debug("Processsing", { len: allEventResult.rows.length });
  for (const row of allEventResult.rows) {
    const { id, data: actions } = row as { id: string; data: Action[] };
    const [_, type] = id.split("/");
    const reducer = wrapReducer(EVENT_TYPES[type]?.reducer ?? identity);
    const data = actions.reduce(reducer, {} as BaseEventType);
    if (!data.winner) {
      logger.debug("Skipping event with no winner", { id });
      continue;
    }
    if (data.winner === "home") {
      result.totalPointsHome += data.worthPoints;
    } else if (data.winner === "away") {
      result.totalPointsAway += data.worthPoints;
    } else {
      invariant(false, "winner wasn't either home or away");
    }
    result.latestResults.push({
      eventType: data.type,
      name: data.name,
      points: data.worthPoints,
      winner: data.winner,
    });
    logger.debug("Computed", {
      id,
      winner: data.winner,
      points: data.worthPoints,
    });
  }
  await DB.collection("_default").upsert("TournamentSummary", result);
}

// updateTournamentSummaryQueue.process(async function (job) {
//   const logger = baseLogger.child({
//     id: job.id,
//   });
//   logger.info("Starting.");
//   await doUpdate(logger);
//   logger.info("Done.");
// });
