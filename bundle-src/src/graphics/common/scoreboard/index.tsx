import { motion } from "framer-motion";
import ScoreBox from "../scoreBox";
import NameBox from "../teamNameBox";
import TimeBox from "../timeBox";
import styles from "./index.module.css";

export interface Props {
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  homePrimaryColor: string;
  awayPrimaryColor: string;
  homeSecondaryColor?: string;
  awaySecondaryColor?: string;
  time: string;
  timeVisible: boolean;
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
  time,
  timeVisible,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={styles.Container}
    >
      <NameBox
        name={homeName}
        primaryColor={homePrimaryColor}
        secondaryColor={homeSecondaryColor}
      />
      <ScoreBox
        score={homeScore}
        primaryColor={homePrimaryColor}
        secondaryColor={homeSecondaryColor}
      />
      <ScoreBox
        score={awayScore}
        primaryColor={awayPrimaryColor}
        secondaryColor={awaySecondaryColor}
      />
      <NameBox
        name={awayName}
        primaryColor={awayPrimaryColor}
        secondaryColor={awaySecondaryColor}
      />
      {timeVisible && <TimeBox time={time} />}
    </motion.div>
  );
}
