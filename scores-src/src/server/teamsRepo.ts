// import { MutateInSpec } from "couchbase";
import invariant from "tiny-invariant";
import { Edit, wrapAction } from "../common/eventStateHelpers";
// import { DB } from "./db";
import { dispatchChangeToEvent } from "./updatesRepo";
import { db } from "./db";
import { EventMeta, Team } from "../generated/prisma/client";

async function updateEvent(id: string, newInfo: Team, oldSlug: string) {
  const [prefix, league, type, eventId] = id.split("/");
  invariant(
    prefix === "EventMeta",
    "updateEvent called with non-meta document"
  );
  const metaResult = await db.eventMeta.findFirstOrThrow({
    where: {
      id: id.replace("EventMeta/", ""),
    },
    include: {
      homeTeamObj: true,
      awayTeamObj: true,
    },
  });
  const meta = metaResult as EventMeta;

  if (meta.homeTeam === oldSlug) {
    meta.homeTeam = newInfo.slug;
  }
  if (meta.awayTeam === oldSlug) {
    meta.awayTeam = newInfo.slug;
  }

  await db.team.update({
    where: {
      slug: oldSlug,
    },
    data: newInfo,
  });

  // await DB.collection("_default").replace(id, meta, { cas: metaResult.cas });
  const editAction = wrapAction(Edit(meta));

  await db.eventHistory.create({
    data: {
      eventId,
      type: editAction.type,
      payload: editAction.payload,
      meta: editAction.meta ?? {},
      ts: new Date(editAction.meta?.ts ?? Date.now()),
    },
  });

  await dispatchChangeToEvent(league, type, eventId, editAction);
}

export async function resyncTeamUpdates(newInfo: Team, oldSlug: string) {
  const rows = await db.eventMeta.findMany({
    where: {
      OR: [{ homeTeam: oldSlug }, { awayTeam: oldSlug }],
    },
  });
  await Promise.all(
    rows.map((row) => updateEvent(`EventMeta/${row.id}`, newInfo, oldSlug))
  );
}
