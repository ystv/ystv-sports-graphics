import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/ultimate";
import { ControlUltimate } from "../../common/types/control-ultimate";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { clockTimeAt, formatMMSSMS } from "@ystv/scores/src/common/clock";
import { useTime } from "../hooks";

export function AllUltimateGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control = useOnlyReplicantValue<ControlUltimate>("control-ultimate");

  const now = useTime();

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
            homeScore={state.scoreHome}
            awayName="YORK"
            awayPrimaryColor="var(--york-white)"
            awaySecondaryColor="var(--ystv-dark)"
            awayScore={state.scoreAway}
            time={formatMMSSMS(clockTimeAt(state.clock, now), 0, 2)}
            timeVisible={control.scoreboard.showTime}
          />
        </GraphicContainer>
      )}
    </>
  );
}
