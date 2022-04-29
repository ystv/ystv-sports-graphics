import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/americanFootball";
import { GraphicContainer } from "../common/container";
import { ControlAmericanFootball } from "common/types/control-americanFootball";
import { Scoreboard } from "./Scoreboard/Scoreboard";
import { useTime } from "../hooks";
import { clockTimeAt } from "@ystv/scores/src/common/clock";
import { MatchStatusPopup } from "../common/matchStatusPopup";

function bannerMsg(quarter: number) {
  return `END OF QUARTER ${quarter}`;
}

export function AllAmericanFootballGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
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
          team1Score={state.scoreHome}
          team2Score={state.scoreAway}
          time={clockTimeAt(state.clock, now)}
          quarter={state.segment}
        />
      </GraphicContainer>
      {control.matchStatusPopup.visible && (
        <GraphicContainer>
          <MatchStatusPopup
            homeName="LANC"
            homePrimaryColor="var(--lancaster-red)"
            homeScore={state.scoreHome}
            awayName="YORK"
            awayPrimaryColor="var(--york-white)"
            awaySecondaryColor="var(--ystv-dark)"
            awayScore={state.scoreAway}
            banner={bannerMsg(state.segment)}
          />
        </GraphicContainer>
      )}
    </>
  );
}
