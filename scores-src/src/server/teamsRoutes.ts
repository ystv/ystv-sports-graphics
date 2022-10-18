import { Router } from "express";
import asyncHandler from "express-async-handler";
import slugify from "slug";
import invariant from "tiny-invariant";
import multer, { memoryStorage } from "multer";
import { BadRequest } from "http-errors";
import { TeamInfo, TeamInfoSchema } from "../common/types";
import { authenticate } from "./auth";
import { DB } from "./db";
import { ensure } from "./errs";
import { MutateInSpec } from "couchbase";
import { resyncTeamUpdates } from "./teamsRepo";
import { cleanupOrphanedAttachments, putAttachment } from "./attachmentsRepo";

const upload = multer({
  storage: memoryStorage(),
  limits: { fileSize: 19 * 1024 * 1024 },
});

export function createTeamsRouter() {
  const router = Router();

  router.get(
    "/",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const result = await DB.query(
        `SELECT e AS data
        FROM _default e
        WHERE meta(e).id LIKE 'Team/%'`
      );
      res.status(200).json(result.rows.map((row) => row.data));
    })
  );

  router.post(
    "/",
    authenticate("write"),
    upload.single("crest"),
    asyncHandler(async (req, res) => {
      const info: TeamInfo = await TeamInfoSchema.omit([
        "crestAttachmentID",
        "slug",
      ]).validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      const slug = slugify(info.name, {
        lower: true,
      });
      info.slug = slug;

      ensure(!!req.file, BadRequest, "no crest");
      info.crestAttachmentID = await putAttachment(
        req.file.buffer,
        req.file.mimetype
      );

      await DB.collection("_default").insert(`Team/${slug}`, info);
      res.status(201).json(info);
    })
  );

  router.put(
    "/:slug",
    authenticate("write"),
    upload.single("crest"),
    asyncHandler(async (req, res) => {
      const oldSlug = req.params.slug;
      invariant(typeof oldSlug === "string", "no slug in path");
      const base = await DB.collection("_default").get(`Team/${oldSlug}`);
      const info: TeamInfo = await TeamInfoSchema.omit([
        "crestAttachmentID",
        "slug",
      ]).validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (req.file) {
        info.crestAttachmentID = await putAttachment(
          req.file.buffer,
          req.file.mimetype
        );
      } else {
        info.crestAttachmentID = base.content.crestAttachmentID;
      }

      const newSlug = slugify(info.name, { lower: true });
      info.slug = newSlug;
      if (newSlug === oldSlug) {
        await DB.collection("_default").replace(`Team/${oldSlug}`, info, {
          cas: base.cas,
        });
      } else {
        // Ensure we insert first to check that it isn't already taken *before* deleting the old value
        await DB.collection("_default").insert(`Team/${newSlug}`, info);
        await DB.collection("_default").remove(`Team/${oldSlug}`);
      }
      await resyncTeamUpdates(info, oldSlug);
      await cleanupOrphanedAttachments();
      res.status(200).json(info);
    })
  );

  return router;
}
