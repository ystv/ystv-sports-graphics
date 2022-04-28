import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/rugbyUnion";
import { ControlRugbyUnion } from "common/types/control-rugbyUnion";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "./Scoreboard/Scoreboard";
import { clockTimeAt } from "@ystv/scores/src/common/clock";
import { useEffect, useRef } from "react";
import { MatchStatus } from "./MatchStatus/MatchStatus";

export function AllRugbyUnionGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control =
    useOnlyReplicantValue<ControlRugbyUnion>("control-rugbyUnion");

  const lastState = useRef<State>();
  useEffect(() => {
    lastState.current = state;
  }, [state]);

  if (!state || !control) {
    return null;
  }

  return (
    <>
      <GraphicContainer>
        <Scoreboard
          isVisible={control.scoreboard.visible}
          isTimerShown={control.scoreboard.timerShown}
          team1Score={state.scoreHome}
          team2Score={state.scoreAway}
          timer={clockTimeAt(state.clock, new Date().valueOf())}
        />
        <MatchStatus
          isVisible={control.matchStatusPopup.visible}
          team1Name="LANC"
          team2Name="YORK"
          team1Score={state.scoreHome}
          team2Score={state.scoreAway}
          isOver={state.halves.length === 2}
        />
      </GraphicContainer>
    </>
  );
}
