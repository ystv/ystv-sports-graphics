import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/football";
import { ControlFootball } from "../../common/types/control-football";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { clockTimeAt, formatMMSSMS } from "@ystv/scores/src/common/clock";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";
import { EventMeta } from "@ystv/scores/src/common/types";

function bannerMsg(half: number) {
  switch (half) {
    case 1:
      return "HALF TIME";
    case 2:
      return "FULL TIME";
    case 3:
      return "FIRST HALF OF EXTRA TIME";
    case 4:
      return "EXTRA TIME";
  }
}

export function AllFootballGraphics() {
  const state = useOnlyReplicantValue<State & EventMeta>("eventState");
  const control = useOnlyReplicantValue<ControlFootball>("control-football");

  const now = useTime();

  if (!state || !control) {
    return null;
  }

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
            time={formatMMSSMS(clockTimeAt(state.clock, now), 0, 2)}
            timeVisible={control.scoreboard.showTime}
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
            banner={bannerMsg(state.halves.length) ?? ""}
          />
        )}
      </GraphicContainer>
    </>
  );
}
