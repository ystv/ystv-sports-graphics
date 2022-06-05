import { LookupInSpec } from "couchbase";
import { Router } from "express";
import asyncHandler from "express-async-handler";
import invariant from "tiny-invariant";
import { getAttachment } from "./attachmentsRepo";

export function createAttachmentsRouter() {
  const router = Router();

  router.get(
    "/:id",
    // Unauthenticated to permit using in an <img> - the ID is unguessable
    asyncHandler(async (req, res) => {
      invariant(typeof req.params.id === "string", "no id in path");
      const [data, { mimeType }] = await getAttachment(req.params.id);
      res.setHeader("Content-Type", mimeType);
      res.status(200).send(data);
    })
  );

  return router;
}
