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
  banner: string;
}

export function MatchStatusPopup(props: MatchStatusPopupProps) {
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
        <div className={styles.Banner}>{props.banner}</div>
      </div>
    </div>
  );
}
