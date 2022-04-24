import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/basketball";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { ControlBasketball } from "common/types/control-basketball";
import { formatMMSSMS, clockTimeAt } from "@ystv/scores/src/common/clock";
import { useState, useRef, useEffect } from "react";
import { useTime } from "../hooks";

export function AllBasketballGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control =
    useOnlyReplicantValue<ControlBasketball>("control-basketball");
  const now = useTime();

  if (!state || !control) {
    return null;
  }

  return (
    <>
      <GraphicContainer>
        <>
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
              timeVisible
            />
          )}
        </>
      </GraphicContainer>
    </>
  );
}
