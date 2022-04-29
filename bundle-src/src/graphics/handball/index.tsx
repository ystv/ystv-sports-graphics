import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/handball";
import { ControlHandball } from "../../common/types/control-handball";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { clockTimeAt, formatMMSSMS } from "@ystv/scores/src/common/clock";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";
import { LineupTable } from "../common/lineupTable";

function bannerMsg(half: number) {
  if (half === 1) {
    return "FULL TIME";
  }
  return "EXTRA TIME";
}

export function AllHandballGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control = useOnlyReplicantValue<ControlHandball>("control-handball");

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
            timeVisible={control.scoreboard.showTime}
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
            banner={bannerMsg(state.segment) ?? ""}
          />
        )}
      </GraphicContainer>
      <GraphicContainer>
        <LineupTable
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          home={state.players!.home.filter(
            (x) => x.startsOnBench === control.lineup.substitutes
          )}
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          away={state.players!.away.filter(
            (x) => x.startsOnBench === control.lineup.substitutes
          )}
          title={
            state.name + (control.lineup.substitutes ? " - Substitutes" : "")
          }
          show={control.lineup.visible}
        />
      </GraphicContainer>
    </>
  );
}
