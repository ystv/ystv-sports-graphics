import { TeamInfo } from "../common/types";
import { DB } from "./db";

export async function resyncTeamUpdates(newInfo: TeamInfo, oldSlug: string) {
  await DB.query(
    `UPDATE _default SET homeTeam = DECODE_JSON($1) WHERE homeTeam.slug = $2`,
    {
      parameters: [JSON.stringify(newInfo), oldSlug],
    }
  );
  await DB.query(
    `UPDATE _default SET awayTeam = DECODE_JSON($1) WHERE awayTeam.slug = $2`,
    {
      parameters: [JSON.stringify(newInfo), oldSlug],
    }
  );
}
