import { DocumentNotFoundError } from "couchbase";
import { Router } from "express";
import asyncHandler from "express-async-handler";
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
      res.status(200).json(data);
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
