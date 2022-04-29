import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/canoePolo";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { ControlCanoePolo } from "common/types/control-canoePolo";
import { formatMMSSMS, clockTimeAt } from "@ystv/scores/src/common/clock";
import { useState, useRef, useEffect } from "react";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";

function bannerMsg(quarter: number) {
  switch (quarter) {
    case 1:
      return "END OF FIRST HALF";
    case 2:
      return "END OF SECOND SECOND";
    default:
      return "OVERTIME";
  }
}

export function AllCanoePoloGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control = useOnlyReplicantValue<ControlCanoePolo>("control-canoePolo");
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
            timeVisible={control.scoreboard.clock}
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
            banner={bannerMsg(state.segment)}
          />
        )}
      </GraphicContainer>
    </>
  );
}
