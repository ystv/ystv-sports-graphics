import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/rosesFencing";
import { ControlRosesFencing } from "../../common/types/control-rosesFencing";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../americanFootball/Scoreboard/Scoreboard";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";
import { EventMeta } from "@ystv/scores/src/common/types";

function bannerMsg(round: number) {
  return `Bout ${round}`;
}

export function AllRosesFencingGraphics() {
  const state = useOnlyReplicantValue<State & EventMeta>("eventState");
  const control = useOnlyReplicantValue<ControlRosesFencing>(
    "control-rosesFencing"
  );

  const now = useTime();

  if (!state || !control) {
    return null;
  }

  return (
    <>
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
          time={0}
          isTimerShown={false}
          isVisible={control.scoreboard.visible}
          quarter={state.segment}
          quarterTitle={"Bout"}
        />
      </GraphicContainer>
      <GraphicContainer>
        {control.matchStatusPopup.visible && (
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
        )}
      </GraphicContainer>
    </>
  );
}
