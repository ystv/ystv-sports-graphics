import { v4 as uuidv4 } from "uuid";
import { DocumentExistsError, LookupInSpec, MutateInSpec } from "couchbase";
import { DB } from "./db";
import { getLogger } from "./loggingSetup";

const logger = getLogger("attachmentsRepo");

export async function getAttachment(
  id: string
): Promise<[Buffer, { mimeType: string }]> {
  const result = await DB.collection("_default").lookupIn(`Attachment/${id}`, [
    LookupInSpec.get("mimeType", { xattr: true }),
  ]);
  const [mime] = result.content;
  const data = await DB.collection("_default").get(`Attachment/${id}`);
  return [data.content, { mimeType: mime.value }];
}

export async function putAttachment(
  contents: Buffer,
  mimeType: string
): Promise<string> {
  for (;;) {
    try {
      const crestID = uuidv4();
      await DB.collection("_default").insert(`Attachment/${crestID}`, contents);
      await DB.collection("_default").mutateIn(`Attachment/${crestID}`, [
        MutateInSpec.insert("mimeType", mimeType, { xattr: true }),
      ]);
      return crestID;
    } catch (e) {
      if (e instanceof DocumentExistsError) {
        continue;
      }
      throw e;
    }
  }
}

export async function cleanupOrphanedAttachments(): Promise<void> {
  const result = await DB.query(
    `SELECT RAW att_id
      FROM _default att
      LET att_id = REPLACE(META(att).id, "Attachment/", "")
      WHERE META(att).id LIKE "Attachment/%"
          AND ARRAY_LENGTH((
              SELECT META(team).id
              FROM _default team
              WHERE META(team).id LIKE "Team/%"
                  AND team.crestAttachmentID = att_id )) = 0`
  );
  const ids = [];
  for (const row of result.rows) {
    ids.push(row);
    await DB.collection("_default").remove(`Attachment/${row}`);
  }
  logger.info("Cleaned up orphaned attachments", { ids });
}
