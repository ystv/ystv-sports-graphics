import styles from "./Scoreboard.module.css";
import { TeamDictionary } from "common/teamDictionary";
import { AnimatePresence, motion } from "framer-motion";
import { useTime } from "../../hooks";
import NameBox from "../../common/teamNameBox";
import ScoreBox from "../../common/scoreBox";
import TimeBox from "../../common/timeBox";
import { formatMMSSMS } from "@ystv/scores/src/common/clock";

export interface ScoreboardProps {
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  homePrimaryColor: string;
  awayPrimaryColor: string;
  homeSecondaryColor?: string;
  awaySecondaryColor?: string;
  homeCrestAttachmentID?: string;
  awayCrestAttachmentID?: string;
  isVisible: boolean;
  isTimerShown: boolean;
  quarter: number;
  time: number;
  quarterTitle?: string;
}

export function Scoreboard({
  awayName,
  awayPrimaryColor,
  awayScore,
  awaySecondaryColor,
  homeName,
  homePrimaryColor,
  homeScore,
  homeSecondaryColor,
  homeCrestAttachmentID,
  awayCrestAttachmentID,
  isVisible = false,
  isTimerShown = false,
  time = 0,
  quarter = 1,
  quarterTitle = "Q",
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
        animate={isVisible ? "visible" : "hidden"}
        exit="hidden"
      >
        <NameBox
          name={homeName}
          primaryColor={homePrimaryColor}
          secondaryColor={homeSecondaryColor}
        />
        <ScoreBox
          primaryColor={homePrimaryColor}
          secondaryColor={homeSecondaryColor}
          score={homeScore}
        />
        <NameBox
          name={awayName}
          primaryColor={awayPrimaryColor}
          secondaryColor={awaySecondaryColor}
        />
        <ScoreBox
          primaryColor={awayPrimaryColor}
          secondaryColor={awaySecondaryColor}
          score={awayScore}
        />
        <NameBox
          name={quarterTitle + " " + quarter}
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
