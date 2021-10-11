import styles from "./Lineup.module.css";

export interface LineupSubsProps {}

export function LineupSubs() {
  return (
    <div className="titleSafe">
      <table style={{ fontWeight: 700 }} className={styles.lineupTable}>
        <tr style={{ textAlign: "center" }}>
          <td className={styles.titleCell}>
            <div>{sides[0].name}</div>
          </td>
          <td />
          <td className={styles.titleCell}>
            <div style={{ backgroundColor: sides[1].color }}>
              {sides[1].name}
            </div>
          </td>
        </tr>
        <tr>
          <td className={styles.groupColumns}>
            {sides[0].team.map((e, i) => (
              <tr className={styles.lineupMicroRow}>
                <td className={styles.positionNumber}>{i + 1}</td>
                <td>
                  {e.name}
                  {e.captain && " (C)"}
                </td>
              </tr>
            ))}
          </td>
          <td className={styles.spacerColumn}></td>
          <td className={styles.groupColumns}>
            {sides[1].team.map((e, i) => (
              <tr className={styles.lineupMicroRow}>
                <td className={styles.positionNumber}>{i + 1}</td>
                <td>
                  {e.name}
                  {e.captain && " (C)"}
                </td>
              </tr>
            ))}
          </td>
        </tr>
      </table>
    </div>
  );
}

const sides = [
  {
    name: "york",
    color: "#faaf18",
    team: [
      { name: "Hope Patton" },
      { name: "Maxine Kemp" },
      { name: "Ruby Elliott", captain: true },
      { name: "Gay Garrison" },
      { name: "Lolita Best" },
      { name: "Mariana Bonilla" },
      { name: "Dorothea Mcclure" },
    ],
  },
  {
    name: "glasgow",
    color: "#002542",
    team: [
      { name: "Marcia Harmon" },
      { name: "Samantha Wiley" },
      { name: "Mildred Spencer" },
      { name: "Lorna Stout" },
      { name: "Marissa Singleton", captain: true },
      { name: "Yolanda Peck" },
      { name: "Shelly O'donnell" },
    ],
  },
];
