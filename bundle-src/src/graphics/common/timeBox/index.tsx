import styles from "./index.module.css";
export default function TimeBox({ time = "00:00" }: { time?: string }) {
  return (
    <div className={styles.Background}>
      <time>{time}</time>
    </div>
  );
}
