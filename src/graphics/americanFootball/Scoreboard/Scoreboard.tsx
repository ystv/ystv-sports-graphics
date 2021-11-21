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
      maxWidth: 0,
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
      width: "calc(var(--width) / 2)",
    },
  };

  const blankVariants = {
    hidden: {
      transition: {
        style: "tween",
        staggerChildren: 0.1,
        staggerDirection: -1,
      },
    },
    visible: {
      transition: {
        style: "tween",
        staggerChildren: 0.2,
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
                  style={{ background: team1.primaryColor }}
                >
                  <div className={styles.parallelogramInnerContainer}>
                    <div
                      style={{
                        color: team1.secondaryColor ?? "var(--light)",
                      }}
                    >
                      <motion.div
                        variants={textVariants}
                        className={styles.teamSpan2}
                        // style={{
                        //   borderColor: team2.secondaryColor ?? "var(--light)",
                        // }}
                      >
                        {team1.teamShort.toUpperCase()}
                      </motion.div>
                      <motion.div
                        style={{
                          borderColor: team2.secondaryColor ?? "var(--light)",
                        }}
                        variants={textVariants}
                        className={styles.teamSpan}
                      />
                      <motion.div
                        variants={textVariants}
                        className={styles.scoreDiv}
                      >
                        {team1Score}
                      </motion.div>
                    </div>
                    <img
                      src="../public/logos/york_cent.png"
                      style={{ opacity: "18%" }}
                    />
                  </div>
                </motion.div>
              </div>
              {/*<motion.div*/}
              {/*  initial="hidden"*/}
              {/*  animate="visible"*/}
              {/*  exit="hidden"*/}
              {/*  variants={scoresVariants}*/}
              {/*  className={styles.scores}*/}
              {/*>*/}
              {/*  {team1Score} - {team2Score}*/}
              {/*</motion.div>*/}
              <div>
                <motion.div
                  variants={variants}
                  className={styles.parallelogram}
                  style={{ background: team2.primaryColor }}
                >
                  <div className={styles.parallelogramInnerContainer}>
                    <div
                      style={{ color: team2.secondaryColor ?? "var(--light)" }}
                    >
                      <motion.div
                        className={styles.teamSpan2}
                        variants={textVariants}
                      >
                        {team2.teamShort.toUpperCase()}
                      </motion.div>
                      <motion.div
                        style={{
                          borderColor: team2.secondaryColor ?? "var(--light)",
                        }}
                        variants={textVariants}
                        className={styles.teamSpan}
                      />
                      <motion.div
                        variants={textVariants}
                        className={styles.scoreDiv}
                      >
                        {team2Score}
                      </motion.div>
                    </div>
                    <img
                      src="../public/logos/north_mustangs.png"
                      style={{ opacity: "20%", right: "10%" }}
                    />
                  </div>
                </motion.div>
              </div>
              <motion.h1 variants={sectionVariants} className={styles.section}>
                <motion.div variants={textVariants}>
                  {matchOver == 1 && "1st"}
                  {matchOver == 2 && "2nd"}
                  {matchOver == 3 && "3rd"}
                  {matchOver == 4 && "4th"}
                </motion.div>
              </motion.h1>
              <motion.div variants={timerVariantsParent}>
                <AnimatePresence>
                  {isTimerShown && (
                    <motion.h1
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={timerVariants}
                      className={styles.timer}
                    >
                      {secondToTimeString(timer)}
                    </motion.h1>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
