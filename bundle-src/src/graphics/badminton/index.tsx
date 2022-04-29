import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/badminton";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { ControlBadminton } from "common/types/control-badminton";
import { formatMMSSMS, clockTimeAt } from "@ystv/scores/src/common/clock";
import { useState, useRef, useEffect } from "react";
import { useTime } from "../hooks";
import { ScoreboardWithSets } from "../common/scoreboardWithSets";

export function AlLBadmintonGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control = useOnlyReplicantValue<ControlBadminton>("control-badminton");

  if (!state || !control) {
    return null;
  }

  return (
    <>
      <GraphicContainer>
        {control.scoreboard.visible && (
          <ScoreboardWithSets
            homeScore={state.currentSetScoreHome}
            awayScore={state.currentSetScoreAway}
            homeSets={state.setsHome}
            awaySets={state.setsAway}
          />
        )}
      </GraphicContainer>
    </>
  );
}
