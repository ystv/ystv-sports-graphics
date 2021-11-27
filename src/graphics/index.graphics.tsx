import ReactDOM from "react-dom";
import React from "react";
import { useOnlyReplicantValue } from "common/useReplicant";
import { Scoreboard } from "./boxing/Scoreboard/Scoreboard";
import "./global.css";
import { Lineup } from "./rugby/Lineup/Lineup";
import { Bug } from "./rugby/Bug/Bug";
import { LineupSubs } from "./rugby/Lineup/LineupSubs";
import { LowerThird } from "./generic/LowerThird/LowerThird";
import { MatchStatus } from "./boxing/MatchStatus/MatchStatus";
import { HoldingCard } from "./generic/HoldingCard/HoldingCard";

function AllGraphics() {
  const team1ID = useOnlyReplicantValue("team1ID", undefined, {
    defaultValue: 0,
  });
  const team2ID = useOnlyReplicantValue("team2ID", undefined, {
    defaultValue: "glasgow",
  });

  //
  const showScoreboard = useOnlyReplicantValue("showScoreboard", undefined, {
    defaultValue: false,
  });
  const team1Score = useOnlyReplicantValue("team1Score", undefined, {
    defaultValue: 0,
  });
  const team2Score = useOnlyReplicantValue("team2Score", undefined, {
    defaultValue: 0,
  });
  const showTimer = useOnlyReplicantValue("showTimer", undefined, {
    defaultValue: false,
  });
  const timer = useOnlyReplicantValue("timer", undefined, {
    defaultValue: 0,
  });

  const showLineup = useOnlyReplicantValue("showLineup", undefined, {
    defaultValue: false,
  });
  const lineupTeam = useOnlyReplicantValue("lineupTeam", undefined, {
    defaultValue: 0,
  });

  const showLineupSubs = useOnlyReplicantValue("showLineupSubs", undefined, {
    defaultValue: false,
  });
  const lineupSubsTeam = useOnlyReplicantValue("lineupSubsTeam", undefined, {
    defaultValue: 0,
  });

  const showThird = useOnlyReplicantValue("showThird", undefined, {
    defaultValue: false,
  });
  const name = useOnlyReplicantValue("name", undefined, { defaultValue: "" });
  const role = useOnlyReplicantValue("role", undefined, {
    defaultValue: "",
  });

  const showBug = useOnlyReplicantValue("showBug", undefined, {
    defaultValue: false,
  });

  const showStatus = useOnlyReplicantValue("showStatus", undefined, {
    defaultValue: false,
  });
  const matchOver = useOnlyReplicantValue("matchOver", undefined, {
    defaultValue: 1,
  });

  const showHoldingCard = useOnlyReplicantValue("showHoldingCard", undefined, {
    defaultValue: false,
  });

  const holdingCardIsGeneric = useOnlyReplicantValue(
    "holdingCardIsGeneric",
    undefined,
    {
      defaultValue: false,
    }
  );
  return (
    <>
      <GraphicContainer>
        <Scoreboard
          isVisible={showScoreboard}
          isTimerShown={showTimer}
          team1Score={team1Score}
          team2Score={team2Score}
          timer={timer}
          team1Name={team1ID}
          team2Name={team2ID}
          matchOver={matchOver}
        />
      </GraphicContainer>
      <GraphicContainer>
        <Lineup isVisible={showLineup} lineupTeam={lineupTeam} />
      </GraphicContainer>
      <GraphicContainer>
        <LineupSubs isVisible={showLineupSubs} team={lineupSubsTeam} />
      </GraphicContainer>
      <GraphicContainer>
        <LowerThird isVisible={showThird} name={name} role={role} />
      </GraphicContainer>
      <GraphicContainer zIndex={50}>
        <Bug state={showBug} />
      </GraphicContainer>
      <GraphicContainer>
        <MatchStatus
          isOver={matchOver}
          isVisible={showStatus}
          team1Name={"york"}
          team2Name={team2ID}
          team1Score={team1Score}
          team2Score={team2Score}
        />
      </GraphicContainer>
      <GraphicContainer zIndex={100}>
        <HoldingCard
          isVisible={showHoldingCard}
          isUnbranded={holdingCardIsGeneric}
        />
      </GraphicContainer>
    </>
  );
}

function GraphicContainer({
  zIndex = 0,
  children,
}: {
  zIndex?: number;
  children: JSX.Element | JSX.Element[];
}) {
  const styles: React.CSSProperties = {
    position: "absolute",
    top: 0,
    height: "100%",
    width: "100%",
    zIndex: zIndex,
  };
  return <div style={styles}>{children}</div>;
}

ReactDOM.render(<AllGraphics />, document.getElementById("root"));
