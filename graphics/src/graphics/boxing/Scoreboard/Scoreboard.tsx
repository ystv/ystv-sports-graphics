import styles from "./Scoreboard.module.css";
import { TeamDictionary } from "common/teamDictionary";
import { AnimatePresence, motion } from "framer-motion";
import { BoxerDictionary } from "../../../common/boxerDictionary";

export interface ScoreboardProps {
  isVisible: boolean;
  isTimerShown: boolean;
  team1Name?: number;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
  timer?: number;
  matchOver?: number;
}

export function Scoreboard({
  isVisible = false,
  isTimerShown = false,
  team1Name = 0,
  team2Name = "glasgow",
  team1Score = 0,
  team2Score = 0,
  timer = 0,
  matchOver = 1,
}: ScoreboardProps) {
  const team1 = BoxerDictionary[team1Name];
  // const team2 = BoxerDictionary[team1Name][1];

  const secondToTimeString = (time: number): string =>
    `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(
      time % 60
    ).padStart(2, "0")}`;

  const variants = {
    hidden: {
      width: 0,
      transition: {
        style: "tween",
        when: "afterChildren",
        staggerChildren: 0.1,
        staggerDirection: -1,
        // delayChildren: 0.2,
      },
    },
    visible: {
      width: "var(--width)",
      transition: {
        style: "tween",
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const textVariants = {
    hidden: {
      y: 50,
      opacity: 0,
      borderLeftWidth: 0,
      transition: {
        style: "tween",
        when: "beforeEach",
      },
    },
    visible: {
      y: 0,
      opacity: 100,
      borderWidth: ".2rem",
      transition: {
        style: "tween",
        when: "afterAll",
      },
    },
  };

  const timerVariants = {
    hidden: {
      width: 0,
      transition: {
        style: "tween",
      },
    },
    visible: {
      width: "8vw",
      transition: {
        style: "tween",
      },
    },
  };

  const timerVariantsParent = {
    hidden: {
      maxWidth: "0vw",
      transition: {
        style: "tween",
      },
    },
    visible: {
      maxWidth: "8vw",
      transition: {
        style: "tween",
      },
    },
  };

  const sectionVariants = {
    ...variants,
    visible: {
      ...variants.visible,
      width: "8vw",
    },
  };

  const timerTextVariants = {
    ...textVariants,
    hidden: {
      opacity: "0%",
    },
    visible: {
      // ...textVariants.visible,
      opacity: "100%",
      transition: {
        style: "tween",
        when: "beforeAll",
        delay: 0,
        duration: 1,
      },
    },
  };

  const blankVariants = {
    hidden: {
      transition: {
        style: "tween",
        // staggerChildren: 0.1,
        staggerDirection: -1,
      },
    },
    visible: {
      transition: {
        style: "tween",
        // staggerChildren: 0.2,
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
          variants={blankVariants}
          className="titleSafe"
        >
          <div className={styles.scoreboard}>
            <div className={styles.toprow}>
              <div>
                <motion.div
                  variants={variants}
                  className={styles.parallelogram}
                  style={{ background: "#ee2222" }}
                >
                  <div className={styles.parallelogramInnerContainer}>
                    <div
                    // style={{
                    //   color: "#ee2222",
                    // }}
                    >
                      <motion.div
                        variants={textVariants}
                        className={styles.teamSpan2}
                        // style={{
                        //   borderColor: team2.secondaryColor ?? "var(--light)",
                        // }}
                      >
                        {team1.redFighter.split(" ")[1].toUpperCase()}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
              <motion.div
                variants={timerVariantsParent}
                style={{
                  width: "8vw",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                <motion.h1
                  variants={sectionVariants}
                  className={styles.section}
                >
                  <motion.div variants={timerTextVariants}>
                    {`Round ${matchOver}`}
                  </motion.div>
                </motion.h1>
                <motion.div
                // style={{ alignSelf: "start" }}
                // variants={timerVariantsParent}
                >
                  <AnimatePresence>
                    <motion.h1
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      // variants={timerVariants}
                      className={styles.timer}
                    >
                      {secondToTimeString(timer)}
                    </motion.h1>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
              <div>
                <motion.div
                  variants={variants}
                  className={styles.parallelogram}
                  style={{ background: "#2222ee" }}
                >
                  <div className={styles.parallelogramInnerContainer}>
                    <div
                    // style={{ color: team2.secondaryColor ?? "var(--light)" }}
                    >
                      <motion.div
                        className={styles.teamSpan2}
                        variants={textVariants}
                      >
                        {team1.blueFighter.split(" ")[1].toUpperCase()}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
