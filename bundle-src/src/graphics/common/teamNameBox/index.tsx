import { getAttachmentURL } from "common/attachments";
import styles from "./index.module.css";

export interface Props {
  name: string;
  primaryColor: string;
  secondaryColor?: string;
  crestAttachmentID?: string;
  away?: boolean;
  sheen?: boolean;
}

export function NameBox(props: Props & React.HTMLAttributes<HTMLDivElement>) {
  const {
    crestAttachmentID,
    name,
    primaryColor,
    secondaryColor,
    sheen: sheenProp,
    away,
    ...rest
  } = props;
  const sheen = sheenProp ?? true;
  return (
    <div
      className={styles.Background + " " + (sheen ? styles.Sheen : "")}
      style={{ backgroundColor: primaryColor }}
      {...rest}
    >
      {crestAttachmentID && (
        <div
          className={styles.Crest + " " + (away ? styles.Away : styles.Home)}
          style={{
            backgroundImage: `url("${getAttachmentURL(crestAttachmentID)}")`,
          }}
        />
      )}
      <h5 className={styles.Text} style={{ color: secondaryColor }}>
        {name.toUpperCase()}
      </h5>
    </div>
  );
}

export default NameBox;
