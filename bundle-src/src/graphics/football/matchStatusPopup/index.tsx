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
  half: number;
}

export function MatchStatusPopup(props: MatchStatusPopupProps) {
  let bannerMsg;
  switch (props.half) {
    case 1:
      bannerMsg = "HALF TIME";
      break;
    case 2:
      bannerMsg = "FULL TIME";
      break;
    case 3:
      bannerMsg = "FIRST HALF OF EXTRA TIME";
      break;
    case 4:
      bannerMsg = "EXTRA TIME";
      break;
  }
  return (
    <div className={styles.Wrapper}>
      <div className={styles.Container}>
        <div
          className={styles.Box}
          style={{
            backgroundColor: props.homePrimaryColor,
            color: props.homeSecondaryColor || "var(--ystv-light)",
          }}
        >
          {props.homeScore}
        </div>
        <div
          className={styles.Box}
          style={{
            backgroundColor: props.awayPrimaryColor,
            color: props.awaySecondaryColor || "var(--ystv-light)",
          }}
        >
          {props.awayScore}
        </div>
        <div className={styles.Banner}>{bannerMsg}</div>
      </div>
    </div>
  );
}
