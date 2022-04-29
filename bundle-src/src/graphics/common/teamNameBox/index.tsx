import styles from "./index.module.css";

export interface Props {
  name: string;
  primaryColor: string;
  secondaryColor?: string;
  sheen?: boolean;
}

export function NameBox({
  name,
  primaryColor,
  secondaryColor,
  sheen: sheenProp,
}: Props) {
  const sheen = sheenProp ?? true;
  return (
    <div
      className={styles.Background + " " + (sheen ? styles.Sheen : "")}
      style={{ backgroundColor: primaryColor }}
    >
      {name[0].toLowerCase() === "l" && <div className={styles.CrestLanc} />}
      {name[0].toLowerCase() === "y" && <div className={styles.CrestYork} />}
      <h5 className={styles.Text} style={{ color: secondaryColor }}>
        {name.substring(0, 4).toUpperCase()}
      </h5>
    </div>
  );
}

export default NameBox;
