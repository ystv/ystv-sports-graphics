import styles from "./Scoreboard.module.css";
import { TeamDictionary } from "common/teamDictionary";
import { AnimatePresence, motion } from "framer-motion";

export interface ScoreboardProps {
  isVisible: boolean;
  isTimerShown: boolean;
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
  timer?: number;
  matchOver?: number;
}

export function Scoreboard({
  isVisible = false,
  isTimerShown = false,
  team1Name = "york",
  team2Name = "glasgow",
  team1Score = 0,
  team2Score = 0,
  timer = 0,
  matchOver = 1,
}: ScoreboardProps) {
  const team1 = TeamDictionary[team1Name];
  const team2 = TeamDictionary[team2Name];

  const secondToTimeString = (time: number): string =>
    `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(
      time % 60
    ).padStart(2, "0")}`;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="titleSafe"
        >
          <div className={styles.scoreboard}>
            <div className={styles.toprow}>
              <motion.div initial="hidden" animate="visible" exit="hidden">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className={styles.parallelogram}
                  style={{ background: team1.primaryColor }}
                >
                  <div className={styles.parallelogramInnerContainer}>
                    <div
                      style={{
                        color: team1.secondaryColor ?? "var(--light)",
                      }}
                    >
                      <span className={styles.teamSpan}>
                        {team1.teamShort.toUpperCase()}
                      </span>
                      <div
                        className={styles.scoreDiv}
                        style={{
                          borderColor: team1.secondaryColor ?? "var(--light)",
                        }}
                      >
                        {team1Score}
                      </div>
                    </div>
                    <img
                      src="../public/logos/york_cent.png"
                      style={{ opacity: "18%" }}
                    />
                  </div>
                </motion.div>
              </motion.div>
              {/*<motion.div*/}
              {/*  initial="hidden"*/}
              {/*  animate="visible"*/}
              {/*  exit="hidden"*/}
              {/*  variants={scoresVariants}*/}
              {/*  className={styles.scores}*/}
              {/*>*/}
              {/*  {team1Score} - {team2Score}*/}
              {/*</motion.div>*/}
              <motion.div initial="hidden" animate="visible" exit="hidden">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className={styles.parallelogram}
                  style={{ background: team2.primaryColor }}
                >
                  <div className={styles.parallelogramInnerContainer}>
                    <div
                      style={{ color: team2.secondaryColor ?? "var(--light)" }}
                    >
                      <span className={styles.teamSpan}>
                        {team2.teamShort.toUpperCase()}
                      </span>
                      <div
                        className={styles.scoreDiv}
                        style={{
                          borderColor: team2.secondaryColor ?? "var(--light)",
                        }}
                      >
                        {team2Score}
                      </div>
                    </div>
                    <img
                      src="../public/logos/north_mustangs.png"
                      style={{ opacity: "20%", right: "10%" }}
                    />
                  </div>
                </motion.div>
              </motion.div>
              <motion.h1
                initial="hidden"
                animate="visible"
                exit="hidden"
                className={styles.section}
              >
                {matchOver == 1 && "1st"}
                {matchOver == 2 && "2nd"}
                {matchOver == 3 && "3rd"}
                {matchOver == 4 && "4th"}
              </motion.h1>
              <AnimatePresence>
                {isVisible && isTimerShown && (
                  <motion.h1
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className={styles.timer}
                  >
                    {secondToTimeString(timer)}
                  </motion.h1>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
