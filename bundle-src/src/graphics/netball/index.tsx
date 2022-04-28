import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/netball";
import { ControlNetball } from "common/types/control-netball";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { formatMMSSMS, clockTimeAt } from "@ystv/scores/src/common/clock";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";

function bannerMsg(quarter: number) {
  switch (quarter) {
    case 1:
      return "END OF FIRST QUARTER";
    case 2:
      return "HALF TIME";
    case 3:
      return "END OF THIRD QUARTER";
    case 4:
      return "FULL TIME";
    default:
      return `OVERTIME PERIOD ${quarter - 4}`;
  }
}

export function AllNetballGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control = useOnlyReplicantValue<ControlNetball>("control-netball");
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
      {control.matchStatusPopup.visible && (
        <GraphicContainer>
          <MatchStatusPopup
            homeName="LANC"
            homePrimaryColor="var(--lancaster-red)"
            homeScore={state.scoreHome}
            awayName="YORK"
            awayPrimaryColor="var(--york-white)"
            awaySecondaryColor="var(--ystv-dark)"
            awayScore={state.scoreAway}
            banner={bannerMsg(state.quarters.length)}
          />
        </GraphicContainer>
      )}
    </>
  );
}
