import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/tableTennis";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { ControlTableTennis } from "common/types/control-tableTennis";
import { ScoreboardWithSets } from "../common/scoreboardWithSets";

export function AllTableTennisGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
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
            homeScore={state.currentGameScoreHome}
            awayScore={state.currentGameScoreAway}
            homeSets={state.gamesHome}
            awaySets={state.gamesAway}
          />
        )}
      </GraphicContainer>
    </>
  );
}
