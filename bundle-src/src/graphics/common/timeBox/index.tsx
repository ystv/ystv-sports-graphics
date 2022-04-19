import styles from "./index.module.css";

export interface Props {
  time: string;
}

export function Component({ time }: Props) {
  return (
    <div className={styles.Background}>
      <h5>{time}</h5>
    </div>
  );
}

export default Component;
