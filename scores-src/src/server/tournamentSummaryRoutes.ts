import { DocumentNotFoundError } from "couchbase";
import { Router } from "express";
import asyncHandler from "express-async-handler";
import { startCase } from "lodash-es";
import { authenticate } from "./auth";
import { DB } from "./db";
import { getLogger } from "./loggingSetup";
import { TournamentSummary } from "./updateTournamentSummary.job";
import { doUpdate as updateTournamentSummary } from "./updateTournamentSummary.job";

const logger = getLogger("tournamentSummaryRoutes");

export function createTournamentSummaryRouter() {
  const router = Router();

  router.get(
    "/",
    // authenticate("read"), // vmix no like
    asyncHandler(async (req, res) => {
      let data: TournamentSummary;
      try {
        data = (await DB.collection("_default").get("TournamentSummary"))
          .content;
      } catch (e) {
        if (e instanceof DocumentNotFoundError) {
          data = {
            latestResults: [],
            totalPointsAway: 0,
            totalPointsHome: 0,
          };
        } else {
          throw e;
        }
      }
      if (req.query?.vmix === "true") {
        res.status(200).json([
          {
            totalPointsAway: data.totalPointsAway,
            totalPointsHome: data.totalPointsHome,
            latestResults: data.latestResults
              .slice(Math.max(0, data.latestResults.length - 10))
              .map(
                (x) =>
                  `${startCase(x.eventType)} ${x.name} - ${
                    x.winner === "home" ? "Lancs" : "York"
                  } Win (+${x.points})`
              )
              .join(" · "),
          },
        ]);
      } else {
        res.status(200).json(data);
      }
    })
  );

  router.post(
    "/recompute",
    authenticate("admin"),
    asyncHandler(async (req, res) => {
      await updateTournamentSummary(logger);
      const data: TournamentSummary = (
        await DB.collection("_default").get("TournamentSummary")
      ).content;
      res.status(200).json(data);
    })
  );

  return router;
}
