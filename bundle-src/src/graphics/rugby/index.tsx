import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/rugbyUnion";
import { ControlRugbyUnion } from "common/types/control-rugbyUnion";
import { GraphicContainer } from "../common/container";
import { clockTimeAt, formatMMSSMS } from "@ystv/scores/src/common/clock";
import { Scoreboard } from "../common/scoreboard";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";
import { EventMeta } from "@ystv/scores/src/common/types";

function bannerMsg(half: number) {
  switch (half) {
    case 0:
      return "";
    case 1:
      return "HALF TIME";
    case 2:
      return "FULL TIME";
    default:
      return "OVERTIME";
  }
}

export function AllRugbyUnionGraphics() {
  const state = useOnlyReplicantValue<State & EventMeta>("eventState");
  const control =
    useOnlyReplicantValue<ControlRugbyUnion>("control-rugbyUnion");

  const now = useTime();

  if (!state || !control) {
    return null;
  }

  const currentHalf =
    (state.halves?.length ?? 0) > 0
      ? state.halves[state.halves.length - 1]
      : null;

  return (
    <>
      <GraphicContainer>
        {control.scoreboard.visible && (
          <Scoreboard
            homeName={state.homeTeam.abbreviation}
            homePrimaryColor={state.homeTeam.primaryColour}
            homeSecondaryColor={state.homeTeam.secondaryColour}
            homeCrestAttachmentID={state.homeTeam.crestAttachmentID}
            homeScore={state.scoreHome}
            awayName={state.awayTeam.abbreviation}
            awayPrimaryColor={state.awayTeam.primaryColour}
            awaySecondaryColor={state.awayTeam.secondaryColour}
            awayCrestAttachmentID={state.awayTeam.crestAttachmentID}
            awayScore={state.scoreAway}
            time={
              formatMMSSMS(clockTimeAt(state.clock, now), 0, 2) +
              (currentHalf && currentHalf.timeLost > 0
                ? `+${currentHalf?.timeLost}`
                : "")
            }
            timeVisible={control.scoreboard.timerShown}
          />
        )}
      </GraphicContainer>
      <GraphicContainer>
        {control.matchStatusPopup.visible && (
          <MatchStatusPopup
            homeName={state.homeTeam.abbreviation}
            homePrimaryColor={state.homeTeam.primaryColour}
            homeSecondaryColor={state.homeTeam.secondaryColour}
            homeCrestAttachmentID={state.homeTeam.crestAttachmentID}
            homeScore={state.scoreHome}
            awayName={state.awayTeam.abbreviation}
            awayPrimaryColor={state.awayTeam.primaryColour}
            awaySecondaryColor={state.awayTeam.secondaryColour}
            awayCrestAttachmentID={state.awayTeam.crestAttachmentID}
            awayScore={state.scoreAway}
            banner={bannerMsg(state.halves.length)}
          />
        )}
      </GraphicContainer>
    </>
  );
}
