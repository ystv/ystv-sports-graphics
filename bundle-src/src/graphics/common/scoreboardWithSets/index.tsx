import { time } from "console";
import ScoreBox from "../scoreBox";
import NameBox from "../teamNameBox";
import TimeBox from "../timeBox";
import styles from "./index.module.css";

export interface Props {
  homeName: string;
  homePrimaryColour: string;
  homeSecondaryColour: string;
  homeCrestAttachmentID: string;
  awayName: string;
  awayPrimaryColour: string;
  awaySecondaryColour: string;
  awayCrestAttachmentID: string;
  homeScore: number;
  awayScore: number;
  homeSets: number;
  awaySets: number;
}

export function ScoreboardWithSets({
  homeName,
  homePrimaryColour,
  homeSecondaryColour,
  homeCrestAttachmentID,
  awayName,
  awayPrimaryColour,
  awaySecondaryColour,
  awayCrestAttachmentID,
  awayScore,
  homeScore,
  homeSets,
  awaySets,
}: Props) {
  return (
    <div className={styles.Container}>
      <div className={styles.Row}>
        <NameBox
          name={homeName}
          primaryColor={homePrimaryColour}
          secondaryColor={homeSecondaryColour}
          crestAttachmentID={homeCrestAttachmentID}
        />
        <ScoreBox
          score={homeSets}
          primaryColor={awayPrimaryColour}
          secondaryColor={awaySecondaryColour}
          sheen={false}
        />
        <ScoreBox
          score={homeScore}
          primaryColor={homePrimaryColour}
          secondaryColor={homeSecondaryColour}
        />
      </div>
      <div className={styles.Row}>
        <NameBox
          name={awayName}
          primaryColor={awayPrimaryColour}
          secondaryColor={awaySecondaryColour}
          crestAttachmentID={awayCrestAttachmentID}
        />
        <ScoreBox
          score={awaySets}
          primaryColor={awayPrimaryColour}
          secondaryColor={awaySecondaryColour}
          sheen={false}
        />
        <ScoreBox
          score={awayScore}
          primaryColor={homePrimaryColour}
          secondaryColor={homeSecondaryColour}
        />
      </div>
    </div>
  );
}
