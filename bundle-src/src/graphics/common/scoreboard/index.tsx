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
  homeCrestAttachmentID?: string;
  awayCrestAttachmentID?: string;
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
  homeCrestAttachmentID,
  awayCrestAttachmentID,
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
        crestAttachmentID={homeCrestAttachmentID}
        data-cy="home-team-name"
      />
      <ScoreBox
        score={homeScore}
        primaryColor={homePrimaryColor}
        secondaryColor={homeSecondaryColor}
        data-cy="home-team-score"
      />
      <ScoreBox
        score={awayScore}
        primaryColor={awayPrimaryColor}
        secondaryColor={awaySecondaryColor}
        data-cy="away-team-score"
      />
      <NameBox
        name={awayName}
        primaryColor={awayPrimaryColor}
        secondaryColor={awaySecondaryColor}
        crestAttachmentID={awayCrestAttachmentID}
        away
        data-cy="away-team-name"
      />
      {timeVisible && <TimeBox time={time} />}
    </motion.div>
  );
}
