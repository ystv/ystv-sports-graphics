import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/badminton";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { ControlBadminton } from "common/types/control-badminton";
import { formatMMSSMS, clockTimeAt } from "@ystv/scores/src/common/clock";
import { useState, useRef, useEffect } from "react";
import { useTime } from "../hooks";

export function AlLBadmintonGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control = useOnlyReplicantValue<ControlBadminton>("control-badminton");

  if (!state || !control) {
    return null;
  }

  return (
    <>
      {control.scoreboard.visible && (
        <GraphicContainer>
          <Scoreboard
            homeName="LANC"
            homePrimaryColor="var(--lancaster-red)"
            // TODO sets too
            homeScore={state.currentSetScoreHome}
            awayName="YORK"
            awayPrimaryColor="var(--york-white)"
            awaySecondaryColor="var(--ystv-dark)"
            awayScore={state.currentSetScoreAway}
            time={""}
            timeVisible={false}
          />
        </GraphicContainer>
      )}
    </>
  );
}
