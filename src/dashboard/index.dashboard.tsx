import React, { Component } from "react";
import ReactDOM from "react-dom";
import { useReplicantValue } from "common/useReplicant";

function Dashboard() {
  const [showScoreboard, setShowScoreboard] = useReplicantValue(
    "showScoreboard",
    undefined,
    {
      defaultValue: false,
    }
  );
  const [team1Score, setTeam1Score] = useReplicantValue(
    "team1Score",
    undefined,
    {
      defaultValue: 0,
    }
  );
  const [team2Score, setTeam2Score] = useReplicantValue(
    "team2Score",
    undefined,
    {
      defaultValue: 0,
    }
  );
  const [timer, setTimer] = useReplicantValue("timer", undefined, {
    defaultValue: "00:00",
  });

  const [showLineup, setShowLineup] = useReplicantValue(
    "showLineup",
    undefined,
    {
      defaultValue: false,
    }
  );
  const [lineupTeam, setLineupTeam] = useReplicantValue(
    "lineupTeam",
    undefined,
    {
      defaultValue: 0,
    }
  );

  const [showLineupSubs, setShowLineupSubs] = useReplicantValue(
    "showLineupSubs",
    undefined,
    {
      defaultValue: false,
    }
  );
  const [lineupSubsTeam, setLineupSubsTeam] = useReplicantValue(
    "lineupSubsTeam",
    undefined,
    {
      defaultValue: 0,
    }
  );

  const [showThird, setShowThird] = useReplicantValue("showThird", undefined, {
    defaultValue: false,
  });
  const [name, setName] = useReplicantValue("name", undefined, {
    defaultValue: "",
  });
  const [role, setRole] = useReplicantValue("role", undefined, {
    defaultValue: "",
  });

  const [showBug, setShowBug] = useReplicantValue("showBug", undefined, {
    defaultValue: false,
  });

  const [showStatus, setShowStatus] = useReplicantValue(
    "showStatus",
    undefined,
    {
      defaultValue: false,
    }
  );
  const [matchOver, setMatchOver] = useReplicantValue("matchOver", undefined, {
    defaultValue: false,
  });
  return (
    <div>
      <label>
        Name
        <input
          type="text"
          value={name || ""}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Role
        <input
          type="text"
          value={role || ""}
          onChange={(e) => setRole(e.target.value)}
        />
      </label>
      <label>
        Show Third
        <input
          type="checkbox"
          checked={showThird || false}
          onChange={(e) => setShowThird(e.target.checked)}
        />
      </label>
      <hr />
      <br />
      <label>
        Show Bug
        <input
          type="checkbox"
          checked={showBug || false}
          onChange={(e) => setShowBug(e.target.checked)}
        />
      </label>
      <hr />
      <br />
      <label>
        Show Scoreboard
        <input
          type="checkbox"
          checked={showScoreboard || false}
          onChange={(e) => setShowScoreboard(e.target.checked)}
        />
      </label>
      <br />
      <label>
        Home Team
        <input
          type="number"
          value={team1Score || 0}
          onChange={(e) => setTeam1Score(Number(e.target.value))}
        />
      </label>
      <label>
        <input
          type="number"
          value={team2Score || 0}
          onChange={(e) => setTeam2Score(Number(e.target.value))}
        />{" "}
        Away Team
      </label>
      <hr />
      <br />
      <label>
        Show Status
        <input
          type="checkbox"
          checked={showStatus || false}
          onChange={(e) => setShowStatus(e.target.checked)}
        />
      </label>
      <label>
        End of match?
        <input
          type="checkbox"
          checked={matchOver || false}
          onChange={(e) => setMatchOver(e.target.checked)}
        />
      </label>
      <hr />
      <br />
    </div>
  );
}

ReactDOM.render(<Dashboard />, document.getElementById("root"));
