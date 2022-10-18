import { Router } from "express";
import { authenticate } from "./auth";
import asyncHandler from "express-async-handler";
import { DB } from "./db";
import { League, LeagueSchema } from "../common/types";
import { v4 as uuidv4 } from "uuid";
import slug from "slug";

export default function createLeaguesRouter() {
  const router = Router();

  function leagueKey(slug: string) {
    return `League/${slug}`;
  }

  router.get(
    "/",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const result = await DB.query(
        `SELECT RAW l FROM _default l
      WHERE meta(l).id LIKE 'League/%'
      ORDER BY MILLIS(l.startDate)`
      );
      res.status(200).json(result.rows as League[]);
    })
  );

  router.put(
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
      await DB.collection("_default").insert(leagueKey(leagueSlug), data);
      res.status(200).json(data);
    })
  );

  return router;
}
