import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/tableTennis";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { ControlTableTennis } from "common/types/control-tableTennis";
import { ScoreboardWithSets } from "../common/scoreboardWithSets";
import { EventMeta } from "@ystv/scores/src/common/types";

export function AllTableTennisGraphics() {
  const state = useOnlyReplicantValue<State & EventMeta>("eventState");
  const control = useOnlyReplicantValue<ControlTableTennis>(
    "control-tableTennis"
  );

  if (!state || !control) {
    return null;
  }

  return (
    <>
      <GraphicContainer>
        {control.scoreboard.visible && (
          <ScoreboardWithSets
            homeName={state.homeTeam.abbreviation}
            homePrimaryColour={state.homeTeam.primaryColour}
            homeSecondaryColour={state.homeTeam.secondaryColour}
            homeCrestAttachmentID={state.homeTeam.crestAttachmentID}
            homeScore={state.currentGameScoreHome}
            awayName={state.awayTeam.abbreviation}
            awayPrimaryColour={state.awayTeam.primaryColour}
            awaySecondaryColour={state.awayTeam.secondaryColour}
            awayCrestAttachmentID={state.awayTeam.crestAttachmentID}
            awayScore={state.currentGameScoreAway}
            homeSets={state.gamesHome}
            awaySets={state.gamesAway}
          />
        )}
      </GraphicContainer>
    </>
  );
}
