import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/lacrosse";
import { ControlLacrosse } from "../../common/types/control-lacrosse";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { clockTimeAt, formatMMSSMS } from "@ystv/scores/src/common/clock";
import { MatchStatusPopup } from "./matchStatusPopup";
import { useTime } from "../hooks";

export function AllLacrosseGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control = useOnlyReplicantValue<ControlLacrosse>("control-lacrosse");

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
              timeVisible={control.scoreboard.showTime}
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
              half={state.quarters.length}
            />
          )}
        </>
      </GraphicContainer>
    </>
  );
}
