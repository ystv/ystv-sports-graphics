import styles from "./index.module.css";

export interface Props {
  score: number;
  primaryColor: string;
  secondaryColor?: string;
  sheen?: boolean;
}

export function Component(props: Props & React.HTMLAttributes<HTMLDivElement>) {
  const {
    score,
    primaryColor,
    secondaryColor,
    sheen: sheenProp,
    ...rest
  } = props;
  const sheen = typeof sheenProp === "boolean" ? sheenProp : true;
  return (
    <div
      className={styles.Background + " " + (sheen ? styles.Sheen : "")}
      style={{ backgroundColor: primaryColor }}
      {...rest}
    >
      <h5 className={styles.Score} style={{ color: secondaryColor }}>
        {score}
      </h5>
    </div>
  );
}

export default Component;
