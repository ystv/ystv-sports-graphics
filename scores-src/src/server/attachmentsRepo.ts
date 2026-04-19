import { v4 as uuidv4 } from "uuid";
// import { DocumentExistsError, LookupInSpec, MutateInSpec } from "couchbase";
import { db } from "./db";
import { getLogger } from "./loggingSetup";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

const logger = getLogger("attachmentsRepo");

export async function getAttachment(
  id: string
): Promise<[Buffer, { mimeType: string }]> {
  const result = await db.attachment.findFirstOrThrow({
    where: {
      id,
    },
  });
  // const result = await DB.collection("_default").lookupIn(`Attachment/${id}`, [
  //   LookupInSpec.get("mimeType", { xattr: true }),
  // ]);
  // const [mime] = result.content;
  // const data = await DB.collection("_default").get(`Attachment/${id}`);
  return [Buffer.from(result.contents), { mimeType: result.mimeType }];
}

export async function putAttachment(
  contents: Buffer,
  mimeType: string
): Promise<string> {
  for (;;) {
    try {
      const res = await db.attachment.create({
        data: {
          contents: new Uint8Array(contents),
          mimeType,
        },
      });
      return res.id;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code == "") {
        continue;
      }
      throw e;
    }
  }
}

export async function cleanupOrphanedAttachments(): Promise<void> {
  const ids = await db.attachment.deleteMany({ where: { team: undefined } });
  logger.info("Cleaned up orphaned attachments", { ids });
}
