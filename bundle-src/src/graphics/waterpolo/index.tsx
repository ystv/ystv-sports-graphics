import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/waterpolo";
import { ControlWaterpolo } from "../../common/types/control-waterpolo";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { clockTimeAt, formatMMSSMS } from "@ystv/scores/src/common/clock";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";
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
  }
}

export function AllWaterpoloGraphics() {
  const state = useOnlyReplicantValue<State & EventMeta>("eventState");
  const control = useOnlyReplicantValue<ControlWaterpolo>("control-waterpolo");

  const now = useTime();

  if (!state || !control) {
    return null;
  }

  return (
    <>
      {control.scoreboard.visible && (
        <GraphicContainer>
          <Scoreboard
            homeName={state.homeTeam.abbreviation}
            homePrimaryColor={state.homeTeam.primaryColour}
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
        </GraphicContainer>
      )}
      {control.matchStatusPopup.visible && (
        <GraphicContainer>
          <MatchStatusPopup
            homeName={state.homeTeam.abbreviation}
            homePrimaryColor={state.homeTeam.primaryColour}
            homeCrestAttachmentID={state.homeTeam.crestAttachmentID}
            homeScore={state.scoreHome}
            awayName={state.awayTeam.abbreviation}
            awayPrimaryColor={state.awayTeam.primaryColour}
            awaySecondaryColor={state.awayTeam.secondaryColour}
            awayCrestAttachmentID={state.awayTeam.crestAttachmentID}
            awayScore={state.scoreAway}
            banner={bannerMsg(state.segment) ?? ""}
          />
        </GraphicContainer>
      )}
    </>
  );
}
