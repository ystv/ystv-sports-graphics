import styles from "./index.module.css";

export interface Props {
  name: string;
  primaryColor: string;
  secondaryColor?: string;
  crestAttachmentID?: string;
  away?: boolean;
  sheen?: boolean;
}

export function NameBox({
  crestAttachmentID,
  name,
  primaryColor,
  secondaryColor,
  sheen: sheenProp,
  away,
}: Props) {
  const sheen = sheenProp ?? true;
  return (
    <div
      className={styles.Background + " " + (sheen ? styles.Sheen : "")}
      style={{ backgroundColor: primaryColor }}
    >
      <div
        className={styles.Crest + " " + (away ? styles.Away : styles.Home)}
        style={{
          backgroundImage: `url("${nodecg.bundleConfig.scoresService.apiURL}/attachments/${crestAttachmentID}")`,
        }}
      />
      <h5 className={styles.Text} style={{ color: secondaryColor }}>
        {name.substring(0, 4).toUpperCase()}
      </h5>
    </div>
  );
}

export default NameBox;
