import styles from "./index.module.css";

export interface Props {
  time: string;
}

export function Component({ time }: Props) {
  return (
    <div className={styles.Background}>
      <div>{time}</div>
    </div>
  );
}

export default Component;
