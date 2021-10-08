import { TeamDictionary, TeamDictionaryTeam } from "common/teamDictionary";
import styles from "./Scoreboard.module.css";

export interface ScoreboardProps {}

export function Scoreboard() {
  const team1 = TeamDictionary.york;
  const team2 = TeamDictionary.glasgow;
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
          <div className={styles.scores}>12 - 26</div>
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
          <div className={styles.timer}>10:23</div>
        </div>
      </div>
    </div>
  );
}
