import { time } from "console";
import ScoreBox from "../scoreBox";
import NameBox from "../teamNameBox";
import TimeBox from "../timeBox";
import styles from "./index.module.css";

export interface Props {
  homeScore: number;
  awayScore: number;
  homeSets: number;
  awaySets: number;
}

export function ScoreboardWithSets({
  awayScore,
  homeScore,
  homeSets,
  awaySets,
}: Props) {
  return (
    <div className={styles.Container}>
      <div className={styles.Row}>
        <NameBox name="LANC" primaryColor="var(--lancaster-red)" />
        <ScoreBox
          score={homeSets}
          primaryColor="var(--ystv-dark)"
          secondaryColor="#fafafa"
          sheen={false}
        />
        <ScoreBox score={homeScore} primaryColor="var(--lancaster-red)" />
      </div>
      <div className={styles.Row}>
        <NameBox
          name="YORK"
          primaryColor="var(--york-white)"
          secondaryColor="var(--ystv-dark)"
        />
        <ScoreBox
          score={awaySets}
          primaryColor="var(--ystv-dark)"
          secondaryColor="#fafafa"
          sheen={false}
        />
        <ScoreBox
          score={awayScore}
          primaryColor="var(--york-white)"
          secondaryColor="var(--ystv-dark)"
        />
      </div>
    </div>
  );
}
