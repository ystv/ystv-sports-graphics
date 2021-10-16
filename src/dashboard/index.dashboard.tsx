import React, { Component, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useReplicantValue } from "common/useReplicant";
import { TeamDictionary } from "common/teamDictionary";

function Dashboard() {
  const [team1ID, setTeam1ID] = useReplicantValue("team1ID", undefined, {
    defaultValue: "york",
  });
  const [team2ID, setTeam2ID] = useReplicantValue("team2ID", undefined, {
    defaultValue: "glasgow",
  });

  //
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
  const [showTimer, setShowTimer] = useReplicantValue("showTimer", undefined, {
    defaultValue: false,
  });
  const [timer, setTimer] = useReplicantValue("timer", undefined, {
    defaultValue: 0,
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
      <h2>Set Teams</h2>
      <label>
        Team1
        <select
          value={team1ID || "york"}
          onChange={(e) => setTeam1ID(e.target.value)}
        >
          {Object.keys(TeamDictionary).map((e) => (
            <option value={e}>{e}</option>
          ))}
        </select>
      </label>
      <label>
        <select
          value={team2ID || "york"}
          onChange={(e) => setTeam2ID(e.target.value)}
        >
          {Object.keys(TeamDictionary).map((e) => (
            <option value={e}>{e}</option>
          ))}
        </select>
        Team2
      </label>
      <hr />
      <h2>Bug</h2>
      <label>
        Show Bug
        <input
          type="checkbox"
          checked={showBug || false}
          onChange={(e) => setShowBug(e.target.checked)}
        />
      </label>
      <hr />
      <h2>Generic Lower Third</h2>
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
      <h2>Scoreboard</h2>
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
      <br />
      <label>
        Include Timer
        <input
          type="checkbox"
          checked={showTimer || false}
          onChange={(e) => setShowTimer(e.target.checked)}
        />
      </label>
      <Stopwatch updateStopWatchTime={setTimer} time={timer} />
      <hr />
      <h2>Half/Full-time Status Aston</h2>
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

function Stopwatch({
  updateStopWatchTime,
  time,
}: {
  updateStopWatchTime: Function;
  time: number;
}) {
  const [interval, setInterval] = useState<number | null>(null);
  const [increment, setIncrement] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useInterval(() => {
    if (time + increment >= 0) {
      updateStopWatchTime(time + increment);
    }
  }, interval);

  const secondToTimeString = (time: number): string =>
    `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(
      time % 60
    ).padStart(2, "0")}`;

  return (
    <div>
      <h1>{secondToTimeString(time)}</h1>
      <button onClick={() => setInterval(1000)}>Start</button>
      <button onClick={() => setInterval(null)}>Stop</button>
      <button onClick={() => updateStopWatchTime(0)}>Reset</button>
      <button onClick={() => setIncrement(-increment)}>Toggle Direction</button>
      <p>{increment == 1 ? "counting up" : "counting down"}</p>
      <br />
      <br />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          updateStopWatchTime(minutes * 60 + seconds);
        }}
      >
        Set Time{" "}
        <input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />{" "}
        :{" "}
        <input
          type="number"
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
        />{" "}
        <button type="submit">Update</button>
      </form>
    </div>
  );
}

function useInterval(callback: any, delay: any) {
  const savedCallback = useRef(() => null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
