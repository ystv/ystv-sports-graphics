import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/football";
import { ControlFootball } from "../../common/types/control-football";
import { GraphicContainer } from "../common/container";
import Scoreboard from "./scoreboard";
import { clockTimeAt, formatMMSSMS } from "@ystv/scores/src/common/clock";
import { useEffect, useRef, useState } from "react";
import { MatchStatusPopup } from "./matchStatusPopup";

function useTime() {
  const [val, setVal] = useState(() => new Date().valueOf());
  const intervalRef = useRef<number>();
  useEffect(() => {
    function update() {
      setVal(new Date().valueOf());
    }
    intervalRef.current = window.setInterval(update, 200);
    return () => window.clearInterval(intervalRef.current);
  }, []);
  return val;
}

export function AllFootballGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control = useOnlyReplicantValue<ControlFootball>("control-football");

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
        <>
          {control.matchStatusPopup.visible && (
            <MatchStatusPopup
              homeName="LANC"
              homePrimaryColor="var(--lancaster-red)"
              homeScore={state.scoreHome}
              awayName="YORK"
              awayPrimaryColor="var(--york-white)"
              awaySecondaryColor="var(--ystv-dark)"
              awayScore={state.scoreAway}
              half={state.halves.length}
            />
          )}
        </>
      </GraphicContainer>
    </>
  );
}
