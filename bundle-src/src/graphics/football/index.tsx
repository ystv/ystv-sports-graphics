import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/football";
import { ControlFootball } from "../../common/types/control-football";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { clockTimeAt, formatMMSSMS } from "@ystv/scores/src/common/clock";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";

function bannerMsg(half: number) {
  switch (half) {
    case 1:
      return "HALF TIME";
    case 2:
      return "FULL TIME";
    case 3:
      return "FIRST HALF OF EXTRA TIME";
    case 4:
      return "EXTRA TIME";
  }
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
              banner={bannerMsg(state.halves.length) ?? ""}
            />
          )}
        </>
      </GraphicContainer>
    </>
  );
}
