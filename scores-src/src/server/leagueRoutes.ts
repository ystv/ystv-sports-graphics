import { Router } from "express";
import { authenticate } from "./auth";
import asyncHandler from "express-async-handler";
import { League, LeagueSchema } from "../common/types";
import { v4 as uuidv4 } from "uuid";
import slug from "slug";
import { db } from "./db";

export function leagueKey(slug: string) {
  return `League/${slug}`;
}

export default function createLeaguesRouter() {
  const router = Router();

  router.get(
    "/",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const result = await db.league.findMany({
        where: {
          hidden: false,
        },
        orderBy: {
          startDate: "asc",
        },
      });
      res.status(200).json(result as League[]);
    })
  );

  router.post(
    "/",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const data = await LeagueSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      const leagueSlug = slug(data.name, {
        lower: true,
      });
      data.slug = leagueSlug;
      await db.league.create({
        data,
      });
      res.status(201).json(data);
    })
  );

  return router;
}
