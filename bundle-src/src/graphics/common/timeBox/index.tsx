import styles from "./index.module.css";

export interface Props {
  time: string;
  backgroundColor?: string;
  textColor?: string;
}

export function Component({
  time,
  backgroundColor: bgProp,
  textColor: txProp,
}: Props) {
  const backgroundColor = bgProp ?? "var(--ystv-dark)";
  const color = txProp ?? "var(--ystv-light)";
  return (
    <div className={styles.Background} style={{ backgroundColor }}>
      <h5 style={{ color }}>{time}</h5>
    </div>
  );
}

export default Component;
