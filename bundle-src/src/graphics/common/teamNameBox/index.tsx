import styles from "./index.module.css";

export interface Props {
  name: string;
  primaryColor: string;
  secondaryColor?: string;
}

export function Component({ name, primaryColor, secondaryColor }: Props) {
  return (
    <div
      className={styles.Background}
      style={{ backgroundColor: primaryColor }}
    >
      <h5 className={styles.Text} style={{ color: secondaryColor }}>
        {name.substring(0, 4).toUpperCase()}
      </h5>
    </div>
  );
}

export default Component;
