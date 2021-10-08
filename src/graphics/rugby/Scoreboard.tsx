import styles from "./Scoreboard.module.css";

export interface ScoreboardProps {}

export function Scoreboard() {
  return (
    <div className="titleSafe">
      <div className={styles.scoreboard}>
        <div className={styles.toprow}>
          <div className={styles.container}>
            <div className={styles.parallelogram}>
              <div className={styles.parallelogramInnerContainer}>
                <h1>YRK</h1>
                <img src="yorksport.svg" style={{ opacity: "18%" }} />
              </div>
            </div>
          </div>
          <div className={styles.scores}>12 - 26</div>
          <div className={styles.container2}>
            <div className={styles.parallelogram2}>
              <div className={styles.parallelogramInnerContainer2}>
                <h1>LAN</h1>
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
