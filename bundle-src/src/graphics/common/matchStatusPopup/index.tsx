import { motion } from "framer-motion";
import styles from "./index.module.css";

export interface MatchStatusPopupProps {
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
  banner: string;
}

export function MatchStatusPopup(props: MatchStatusPopupProps) {
  return (
    <motion.div
      className={styles.Wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.Container}>
        <div
          className={styles.Box}
          style={{
            backgroundColor: props.homePrimaryColor,
            color: props.homeSecondaryColor || "var(--ystv-light)",
          }}
        >
          <div
            className={styles.Crest + " " + styles.Home}
            style={{
              backgroundImage: `url("${nodecg.bundleConfig.scoresService.apiURL}/attachments/${props.homeCrestAttachmentID}")`,
            }}
          />
          {props.homeScore}
        </div>
        <div
          className={styles.Box}
          style={{
            backgroundColor: props.awayPrimaryColor,
            color: props.awaySecondaryColor || "var(--ystv-light)",
          }}
        >
          <div
            className={styles.Crest + " " + styles.Away}
            style={{
              backgroundImage: `url("${nodecg.bundleConfig.scoresService.apiURL}/attachments/${props.awayCrestAttachmentID}")`,
            }}
          />
          {props.awayScore}
        </div>
        <div className={styles.Banner}>{props.banner}</div>
      </div>
    </motion.div>
  );
}
