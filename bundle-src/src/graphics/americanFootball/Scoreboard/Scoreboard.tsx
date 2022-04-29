import styles from "./Scoreboard.module.css";
import { TeamDictionary } from "common/teamDictionary";
import { AnimatePresence, motion } from "framer-motion";
import { useTime } from "../../hooks";
import NameBox from "../../common/teamNameBox";
import ScoreBox from "../../common/scoreBox";
import TimeBox from "../../common/timeBox";
import { formatMMSSMS } from "@ystv/scores/src/common/clock";

export interface ScoreboardProps {
  isVisible: boolean;
  isTimerShown: boolean;
  team1Score: number;
  team2Score: number;
  quarter: number;
  time: number;
}

export function Scoreboard({
  isVisible = false,
  isTimerShown = false,
  team1Score = 0,
  team2Score = 0,
  time = 0,
  quarter = 1,
}: ScoreboardProps) {
  const now = useTime();

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <motion.div className={styles.Wrapper}>
      <motion.div
        className={styles.Container}
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <NameBox name="LANC" primaryColor="var(--lancaster-red)" />
        <ScoreBox primaryColor="var(--lancaster-red)" score={team1Score} />
        <NameBox
          name="YORK"
          primaryColor="var(--york-white)"
          secondaryColor="var(--ystv-dark)"
        />
        <ScoreBox
          primaryColor="var(--york-white)"
          secondaryColor="var(--ystv-dark)"
          score={team2Score}
        />
        <NameBox
          name={"Q" + quarter}
          primaryColor="var(--ystv-dark)"
          sheen={false}
        />
        {isTimerShown && (
          <TimeBox
            time={formatMMSSMS(time, 0, 2)}
            backgroundColor="var(--ystv-light)"
            textColor="var(--ystv-dark)"
          />
        )}
      </motion.div>
    </motion.div>
  );
}
