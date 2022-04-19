import styles from "./index.module.css";

export interface Props {
  score: number;
  primaryColor: string;
  secondaryColor?: string;
}

export function Component({ score, primaryColor, secondaryColor }: Props) {
  return (
    <div
      className={styles.Background}
      style={{ backgroundColor: primaryColor }}
    >
      <h5 className={styles.Score} style={{ color: secondaryColor }}>
        {score}
      </h5>
    </div>
  );
}

export default Component;
