import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/volleyball";
import { ControlVolleyball } from "../../common/types/control-volleyball";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { clockTimeAt, formatMMSSMS } from "@ystv/scores/src/common/clock";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";
import { ScoreboardWithSets } from "../common/scoreboardWithSets";
import { EventMeta } from "@ystv/scores/src/common/types";

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
  const state = useOnlyReplicantValue<State & EventMeta>("eventState");
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
            homeName={state.homeTeam.abbreviation}
            homePrimaryColour={state.homeTeam.primaryColour}
            homeSecondaryColour={state.homeTeam.secondaryColour}
            homeCrestAttachmentID={state.homeTeam.crestAttachmentID}
            homeScore={state.currentSetScoreHome}
            awayName={state.awayTeam.abbreviation}
            awayPrimaryColour={state.awayTeam.primaryColour}
            awaySecondaryColour={state.awayTeam.secondaryColour}
            awayCrestAttachmentID={state.awayTeam.crestAttachmentID}
            awayScore={state.currentSetScoreAway}
            homeSets={state.setsHome}
            awaySets={state.setsAway}
          />
        )}
      </GraphicContainer>
      <GraphicContainer>
        {control.matchStatusPopup.visible && (
          <MatchStatusPopup
            homeName={state.homeTeam.abbreviation}
            homePrimaryColor={state.homeTeam.primaryColour}
            homeCrestAttachmentID={state.homeTeam.crestAttachmentID}
            homeScore={state.currentSetScoreHome}
            awayName={state.awayTeam.abbreviation}
            awayPrimaryColor={state.awayTeam.primaryColour}
            awaySecondaryColor={state.awayTeam.secondaryColour}
            awayCrestAttachmentID={state.awayTeam.crestAttachmentID}
            awayScore={state.currentSetScoreAway}
            banner=""
          />
        )}
      </GraphicContainer>
    </>
  );
}
