import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/basketball";
import { GraphicContainer } from "../common/container";
import { Scoreboard } from "../common/scoreboard";
import { ControlBasketball } from "common/types/control-basketball";
import { formatMMSSMS, clockTimeAt } from "@ystv/scores/src/common/clock";
import { useState, useRef, useEffect } from "react";
import { useTime } from "../hooks";
import { MatchStatusPopup } from "../common/matchStatusPopup";
import { EventMeta } from "@ystv/scores/src/common/types";

function bannerMsg(quarter: number) {
  switch (quarter) {
    case 1:
      return "END OF FIRST QUARTER";
    case 2:
      return "END OF SECOND QUARTER";
    case 3:
      return "END OF THIRD QUARTER";
    case 4:
      return "END OF MATCH";
    default:
      return "";
  }
}

export function AllBasketballGraphics() {
  const state = useOnlyReplicantValue<State & EventMeta>("eventState");
  const control =
    useOnlyReplicantValue<ControlBasketball>("control-basketball");
  const now = useTime();

  if (!state || !control) {
    return null;
  }

  return (
    <>
      <GraphicContainer>
        {control.scoreboard.visible && (
          <Scoreboard
            homeName={state.homeTeam.abbreviation}
            homePrimaryColor={state.homeTeam.primaryColour}
            homeCrestAttachmentID={state.homeTeam.crestAttachmentID}
            homeScore={state.scoreHome}
            awayName={state.awayTeam.abbreviation}
            awayPrimaryColor={state.awayTeam.primaryColour}
            awaySecondaryColor={state.awayTeam.secondaryColour}
            awayCrestAttachmentID={state.awayTeam.crestAttachmentID}
            awayScore={state.scoreAway}
            time={formatMMSSMS(clockTimeAt(state.clock, now), 0, 2)}
            timeVisible={control.scoreboard.clock}
          />
        )}
      </GraphicContainer>
      <GraphicContainer>
        {control.matchStatusPopup.visible && (
          <MatchStatusPopup
            homeName={state.homeTeam.abbreviation}
            homePrimaryColor={state.homeTeam.primaryColour}
            homeCrestAttachmentID={state.homeTeam.crestAttachmentID}
            homeScore={state.scoreHome}
            awayName={state.awayTeam.abbreviation}
            awayPrimaryColor={state.awayTeam.primaryColour}
            awaySecondaryColor={state.awayTeam.secondaryColour}
            awayCrestAttachmentID={state.awayTeam.crestAttachmentID}
            awayScore={state.scoreAway}
            banner={bannerMsg(state.segment)}
          />
        )}
      </GraphicContainer>
    </>
  );
}
