import styles from "./Lineup.module.css";

export interface LineupSubsProps {}

export function LineupSubs() {
  return (
    <div className="titleSafe">
      <table style={{ fontWeight: 700 }} className={styles.lineupTable}>
        <tr style={{ textAlign: "center" }}>
          {sides.map((e, i) => (
            <>
              <td className={styles.titleCell}>
                <div style={{ backgroundColor: e.color }}>{e.name}</div>
              </td>
              {i == 0 && <td />}
            </>
          ))}
        </tr>
        <tr>
          {sides.map((side, i) => (
            <>
              <td className={styles.groupColumns}>
                {side.team.map((e, i) => (
                  <tr className={styles.lineupMicroRow}>
                    <td className={styles.positionNumber}>{i + 1}</td>
                    <td>
                      {e.name}
                      {e.captain && " (C)"}
                    </td>
                  </tr>
                ))}
              </td>
              {i == 0 && <td className={styles.spacerColumn} />}
            </>
          ))}
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
