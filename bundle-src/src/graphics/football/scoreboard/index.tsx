import TimeBox from "../../common/timeBox";
import ScoreBox from "../../common/scoreBox";
import styles from "./index.module.css";
import NameBox from "../../common/teamNameBox";

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

export function Component({
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
    <div className={styles.Container}>
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
    </div>
  );
}

export default Component;
