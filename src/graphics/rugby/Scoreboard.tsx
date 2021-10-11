import styles from "./Scoreboard.module.css";

export interface ScoreboardProps {
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
  timer?: string;
}

export function Scoreboard({
  team1Name = "york",
  team2Name = "glasgow",
  team1Score = 0,
  team2Score = 0,
  timer = "00:00",
}: ScoreboardProps) {
  const team1 = TeamDictionary[team1Name];
  const team2 = TeamDictionary[team2Name];
  return (
    <div className="titleSafe">
      <div className={styles.scoreboard}>
        <div className={styles.toprow}>
          <div className={styles.container}>
            <div
              className={styles.parallelogram}
              style={{ background: team1.primaryColor }}
            >
              <div className={styles.parallelogramInnerContainer}>
                <h1 style={{ color: team1.secondaryColor ?? "var(--light)" }}>
                  {team1.teamShort.toUpperCase()}
                </h1>
                <img src="yorksport.svg" style={{ opacity: "18%" }} />
              </div>
            </div>
          </div>
          <div className={styles.scores}>
            {team1Score} - {team2Score}
          </div>
          <div className={styles.container2}>
            <div
              className={styles.parallelogram2}
              style={{ background: team2.primaryColor }}
            >
              <div className={styles.parallelogramInnerContainer2}>
                <h1 style={{ color: team2.secondaryColor ?? "var(--light)" }}>
                  {team2.teamShort.toUpperCase()}
                </h1>
                <img src="lancs.svg" style={{ opacity: "40%" }} />
              </div>
            </div>
          </div>
          <div className={styles.timer}>{timer}</div>
        </div>
      </div>
    </div>
  );
}

export interface TeamDictionaryTeam {
  teamName: string;
  logoSVG?: string;
  primaryColor: string;
  secondaryColor?: string;
  teamShort: string;
}

export const TeamDictionary: Record<string, TeamDictionaryTeam> = {
  york: { teamName: "York", primaryColor: "#FAAF18", teamShort: "yrk" },
  glasgow: {
    teamName: "Glasgow",
    primaryColor: "#0d0802",
    secondaryColor: "#ffdd1a",
    teamShort: "gls",
  },
  leeds: {
    teamName: "Leeds",
    primaryColor: "#44ff33",
    teamShort: "lds",
  },
};
