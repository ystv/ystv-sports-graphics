import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/americanFootball";
import { GraphicContainer } from "../common/container";
import { ControlAmericanFootball } from "common/types/control-americanFootball";
import { Scoreboard } from "./Scoreboard/Scoreboard";
import { useTime } from "../hooks";
import { clockTimeAt } from "@ystv/scores/src/common/clock";
import { MatchStatus } from "./MatchStatus/MatchStatus";

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
      <GraphicContainer>
        <MatchStatus
          isVisible={control.matchStatusPopup.visible}
          team1Name="LANC"
          team1Score={state.scoreHome}
          team2Name="YORK"
          team2Score={state.scoreAway}
          timer={""}
          isOver={state.segment}
        />
      </GraphicContainer>
    </>
  );
}
