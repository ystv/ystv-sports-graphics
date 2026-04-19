import { Router } from "express";
import asyncHandler from "express-async-handler";
import { startCase } from "lodash-es";
import invariant from "tiny-invariant";
import { authenticate } from "./auth";
import { getLogger } from "./loggingSetup";
import { doUpdate as updateTournamentSummary } from "./updateTournamentSummary.job";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { db } from "./db";
import { LeagueSummary } from "../generated/prisma/client";

const logger = getLogger("tournamentSummaryRoutes");

export function createTournamentSummaryRouter() {
  const router = Router();

  router.get(
    "/:league",
    // authenticate("read"), // vmix no like
    asyncHandler(async (req, res) => {
      const league = req.params.league;
      invariant(typeof league === "string", "no league from url");
      let data: LeagueSummary;
      try {
        data = await db.leagueSummary.findUniqueOrThrow({
          where: { id: league },
        });
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError && e.code === "P2001") {
          data = {
            id: league,
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
    "/:league/recompute",
    authenticate("admin"),
    asyncHandler(async (req, res) => {
      const league = req.params.league;
      invariant(typeof league === "string", "no league from url");
      await updateTournamentSummary(logger, league);
      const data: LeagueSummary = await db.leagueSummary.findUniqueOrThrow({
        where: { id: league },
      });
      res.status(200).json(data);
    })
  );

  return router;
}
