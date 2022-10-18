import { MutateInSpec } from "couchbase";
import invariant from "tiny-invariant";
import { Edit, wrapAction } from "../common/eventStateHelpers";
import { EventMeta, TeamInfo } from "../common/types";
import { DB } from "./db";
import { dispatchChangeToEvent } from "./updatesRepo";

async function updateEvent(id: string, newInfo: TeamInfo, oldSlug: string) {
  const [prefix, league, type, eventId] = id.split("/");
  invariant(
    prefix === "EventMeta",
    "updateEvent called with non-meta document"
  );
  const metaResult = await DB.collection("_default").get(id);
  const meta = metaResult.content as EventMeta;

  if (meta.homeTeam.slug === oldSlug) {
    meta.homeTeam = newInfo;
  }
  if (meta.awayTeam.slug === oldSlug) {
    meta.awayTeam = newInfo;
  }

  await DB.collection("_default").replace(id, meta, { cas: metaResult.cas });
  const editAction = wrapAction(Edit(meta));
  await DB.collection("_default").mutateIn(
    `EventHistory/${league}/${type}/${eventId}`,
    [MutateInSpec.arrayAppend("", editAction)]
  );
  await dispatchChangeToEvent(league, type, eventId, editAction);
}

export async function resyncTeamUpdates(newInfo: TeamInfo, oldSlug: string) {
  const rows = (
    await DB.query(
      "SELECT RAW meta().id FROM _default WHERE meta().id LIKE 'EventMeta/%' AND (homeTeam.slug = $1 OR awayTeam.slug = $1)",
      {
        parameters: [oldSlug],
      }
    )
  ).rows;
  console.log(rows);
  await Promise.all(rows.map((id) => updateEvent(id, newInfo, oldSlug)));
}
