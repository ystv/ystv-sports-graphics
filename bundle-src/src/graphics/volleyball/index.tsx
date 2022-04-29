import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/volleyball";
import { ControlVolleyball } from "../../common/types/control-volleyball";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { clockTimeAt, formatMMSSMS } from "@ystv/scores/src/common/clock";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";
import { ScoreboardWithSets } from "../common/scoreboardWithSets";

function bannerMsg(half: number) {
  switch (half) {
    case 1:
      return "END OF FIRST QUARTER";
    case 2:
      return "HALF TIME";
    case 3:
      return "END OF THIRD QUARTER";
    case 4:
      return "FULL TIME";
    default:
      return `OVERTIME PERIOD ${half - 4}`;
  }
}

export function AllVolleyballGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control =
    useOnlyReplicantValue<ControlVolleyball>("control-volleyball");

  const now = useTime();

  if (!state || !control) {
    return null;
  }

  return (
    <>
      <GraphicContainer>
        {control.scoreboard.visible && (
          <ScoreboardWithSets
            homeScore={state.currentSetScoreHome}
            awayScore={state.currentSetScoreAway}
            homeSets={state.setsHome}
            awaySets={state.setsAway}
          />
        )}
      </GraphicContainer>
      <GraphicContainer>
        {control.matchStatusPopup.visible && (
          <MatchStatusPopup
            homeName="LANC"
            homePrimaryColor="var(--lancaster-red)"
            homeScore={state.currentSetScoreHome}
            awayName="YORK"
            awayPrimaryColor="var(--york-white)"
            awaySecondaryColor="var(--ystv-dark)"
            awayScore={state.currentSetScoreAway}
            banner=""
          />
        )}
      </GraphicContainer>
    </>
  );
}
