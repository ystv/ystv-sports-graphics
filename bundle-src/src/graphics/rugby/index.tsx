import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/rugbyUnion";
import { ControlRugbyUnion } from "common/types/control-rugbyUnion";
import { GraphicContainer } from "../common/container";
import { clockTimeAt, formatMMSSMS } from "@ystv/scores/src/common/clock";
import { useEffect, useRef } from "react";
import { MatchStatus } from "./MatchStatus/MatchStatus";
import { Scoreboard } from "../common/scoreboard";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";

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
  const state = useOnlyReplicantValue<State>("eventState");
  const control =
    useOnlyReplicantValue<ControlRugbyUnion>("control-rugbyUnion");

  const lastState = useRef<State>();
  useEffect(() => {
    lastState.current = state;
  }, [state]);

  const now = useTime();

  if (!state || !control) {
    return null;
  }

  return (
    <>
      <GraphicContainer>
        {control.scoreboard.visible && (
          <Scoreboard
            homeName="LANC"
            homePrimaryColor="var(--lancaster-red)"
            homeScore={state.scoreHome}
            awayName="YORK"
            awayPrimaryColor="var(--york-white)"
            awaySecondaryColor="var(--ystv-dark)"
            awayScore={state.scoreAway}
            time={formatMMSSMS(clockTimeAt(state.clock, now), 0, 2)}
            timeVisible={control.scoreboard.timerShown}
          />
        )}
      </GraphicContainer>
      <GraphicContainer>
        {control.matchStatusPopup.visible && (
          <MatchStatusPopup
            homeName="LANC"
            homePrimaryColor="var(--lancaster-red)"
            homeScore={state.scoreHome}
            awayName="YORK"
            awayPrimaryColor="var(--york-white)"
            awaySecondaryColor="var(--ystv-dark)"
            awayScore={state.scoreAway}
            banner={bannerMsg(state.halves.length)}
          />
        )}
      </GraphicContainer>
    </>
  );
}
