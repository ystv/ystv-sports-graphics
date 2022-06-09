import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/americanFootball";
import { GraphicContainer } from "../common/container";
import { ControlAmericanFootball } from "common/types/control-americanFootball";
import { Scoreboard } from "./Scoreboard/Scoreboard";
import { useTime } from "../hooks";
import { clockTimeAt } from "@ystv/scores/src/common/clock";
import { MatchStatusPopup } from "../common/matchStatusPopup";
import { EventMeta } from "@ystv/scores/src/common/types";

function bannerMsg(quarter: number) {
  return `END OF QUARTER ${quarter}`;
}

export function AllAmericanFootballGraphics() {
  const state = useOnlyReplicantValue<State & EventMeta>("eventState");
  const control = useOnlyReplicantValue<ControlAmericanFootball>(
    "control-americanFootball"
  );
  const now = useTime();

  if (!state || !control) {
    return null;
  }

  return (
    <>
      <GraphicContainer>
        <Scoreboard
          isTimerShown={control.scoreboard.timer}
          isVisible={control.scoreboard.visible}
          homeName={state.homeTeam.abbreviation}
          homePrimaryColor={state.homeTeam.primaryColour}
          homeCrestAttachmentID={state.homeTeam.crestAttachmentID}
          homeScore={state.scoreHome}
          awayName={state.awayTeam.abbreviation}
          awayPrimaryColor={state.awayTeam.primaryColour}
          awaySecondaryColor={state.awayTeam.secondaryColour}
          awayCrestAttachmentID={state.awayTeam.crestAttachmentID}
          awayScore={state.scoreAway}
          time={clockTimeAt(state.clock, now)}
          quarter={state.segment}
        />
      </GraphicContainer>
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
            banner={bannerMsg(state.segment)}
          />
        </GraphicContainer>
      )}
    </>
  );
}
