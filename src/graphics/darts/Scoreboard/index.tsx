import styles from "./index.module.css";
import { TeamDictionary } from "common/teamDictionary";
import { AnimatePresence, motion } from "framer-motion";

export interface ScoreboardProps {
  isVisible: boolean;
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
}

export function Scoreboard({
  isVisible = false,
  team1Name = "york",
  team2Name = "glasgow",
  team1Score = 0,
  team2Score = 0,
}: ScoreboardProps) {
  const team1 = TeamDictionary[team1Name];
  const team2 = TeamDictionary[team2Name];

  const secondToTimeString = (time: number): string =>
    `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(
      time % 60
    ).padStart(2, "0")}`;

  const parallelogramVariants = {
    hidden: {
      width: 0,
      transition: {
        delay: 1,
        type: "tween",
      },
    },
    visible: {
      width: "var(--width)",
      transition: {
        delay: 1,
        type: "tween",
      },
    },
  };
  const scoresVariants = {
    hidden: {
      width: 0,
      transition: {
        delay: 0.8,
        type: "tween",
      },
    },
    visible: {
      width: "calc(var(--width) * 1.4)",
      transition: {
        delay: 0.8,
        type: "tween",
      },
    },
  };
  const extrasVariants = {
    hidden: {
      width: 0,
      transition: {
        delay: 0,
        type: "tween",
      },
    },
    visible: {
      width: "var(--width)",
      transition: {
        delay: 1,
        type: "tween",
      },
    },
  };

  const variants = {
    hidden: {
      maxWidth: 0,
      transition: {
        delay: 0,
        type: "tween",
      },
    },
    visible: {
      maxWidth: "20vw",
      transition: {
        delay: 1,
        type: "tween",
      },
    },
  };
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="titleSafe"
        >
          <motion.div variants={variants} style={{ overflow: "hidden" }}>
            <table className={styles.scoreboard}>
              <tbody>
                <tr>
                  <td
                    className={styles.parallelogram}
                    style={{ background: team1.primaryColor }}
                  >
                    <h1
                      style={{ color: team1.secondaryColor ?? "var(--light)" }}
                    >
                      {team1.teamShort.toUpperCase()}
                    </h1>
                  </td>
                  <td className={styles.parallelogram2}>
                    <h1
                      style={{ color: team1.secondaryColor ?? "var(--light)" }}
                    >
                      {team1Score}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td
                    className={styles.parallelogram}
                    style={{ background: team2.primaryColor }}
                  >
                    <h1
                      style={{ color: team2.secondaryColor ?? "var(--light)" }}
                    >
                      {team2.teamShort.toUpperCase()}
                    </h1>
                  </td>
                  <td className={styles.parallelogram2}>
                    <h1
                      style={{ color: team1.secondaryColor ?? "var(--light)" }}
                    >
                      {team2Score}
                    </h1>
                  </td>
                </tr>
              </tbody>
            </table>
          </motion.div>
          {/* <div className={styles.scoreboard}>
            <div className={styles.toprow}>
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={parallelogramVariants}
                className={styles.container}
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={parallelogramVariants}
                  className={styles.parallelogram}
                  style={{ background: team1.primaryColor }}
                >
                  <div className={styles.parallelogramInnerContainer}>
                    <h1
                      style={{ color: team1.secondaryColor ?? "var(--light)" }}
                    >
                      {team1.teamShort.toUpperCase()}
                    </h1>
                    {/* <img src="yorksport.svg" style={{ opacity: "18%" }} />
                  </div>
                </motion.div>
              </motion.div>
              {/* <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={scoresVariants}
                className={styles.scores}
              >
                {team1Score} - {team2Score}
              </motion.div>
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={parallelogramVariants}
                className={styles.container2}
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={parallelogramVariants}
                  className={styles.parallelogram2}
                  style={{ background: team2.primaryColor }}
                >
                  <div className={styles.parallelogramInnerContainer2}>
                    <h1
                      style={{ color: team2.secondaryColor ?? "var(--light)" }}
                    >
                      {team2.teamShort.toUpperCase()}
                    </h1>
                    {/*<img src="lancs.svg" style={{ opacity: "40%" }} />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div> */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
