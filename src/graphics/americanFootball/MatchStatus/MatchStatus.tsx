import styles from "./MatchStatus.module.css";
import { TeamDictionary } from "common/teamDictionary";
import { AnimatePresence, motion } from "framer-motion";

export interface MatchStatusProps {
  isVisible: boolean;
  isOver: number;
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
  timer?: string;
}

export function MatchStatus({
  isVisible = false,
  isOver = 1,
  team1Name = "york",
  team2Name = "glasgow",
  team1Score = 0,
  team2Score = 0,
  timer = "00:00",
}: MatchStatusProps) {
  const team1 = TeamDictionary[team1Name];
  const team2 = TeamDictionary[team2Name];
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
      width: "calc(3.18 * var(--width))",
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
          //variants={variants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="titleSafe"
        >
          <div className={styles.scoreboard}>
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
                    {/*<img src="yorksport.svg" style={{ opacity: "18%" }} />*/}
                  </div>
                </motion.div>
              </motion.div>
              <motion.div
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
                    {/*<img src="lancs.svg" style={{ opacity: "40%" }} />*/}
                  </div>
                </motion.div>
              </motion.div>
            </div>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={extrasVariants}
              className={styles.timer}
            >
              {isOver == 1 && "End of 1st Quarter"}
              {isOver == 2 && "End of 2nd Quarter"}
              {isOver == 3 && "End of 3rd Quarter"}
              {isOver == 4 && "Final"}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
