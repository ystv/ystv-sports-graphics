import styles from "./MatchStatus.module.css";
import { motion, AnimatePresence } from "framer-motion";
// import { TeamDictionary } from "../../../common/teamDictionary";
import { BoxerDictionary } from "../../../common/boxerDictionary";

export interface MatchStatusProps {
  isVisible: boolean;
  lineupTeam: number;
}

export const cellVariants = {
  visible: { y: 0, opacity: 1 },
  hidden: { y: -20, opacity: 0 },
};
export const titleVariants = {
  hidden: {
    maxWidth: 0,
    minWidth: 0,
    padding: "1vh 0vw",
    transition: {
      duration: 1,
      type: "tween",
      delay: 1,
    },
  },
  visible: {
    maxWidth: "80vw",
    minWidth: "20vw",
    padding: "1vh 5vw",
    transition: {
      duration: 1,
      type: "tween",
    },
  },
};

export const columnVariants = {
  hidden: {
    transition: {
      staggerDirection: -1,
      staggerChildren: 0.05,
    },
  },
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

export const bodyVariants = {
  hidden: {
    transition: {
      staggerDirection: -1,
      staggerChildren: 0.5,
    },
  },
  visible: {
    transition: { staggerChildren: 0.5, delayChildren: 0.8 },
  },
};

export function MatchStatus({ isVisible, lineupTeam = 0 }: MatchStatusProps) {
  const team1 = BoxerDictionary[lineupTeam][0];
  const team2 = BoxerDictionary[lineupTeam][1];
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="titleSafe"
        >
          <table
            style={{ fontWeight: 700, tableLayout: "fixed" }}
            className={styles.lineupTable}
          >
            <colgroup>
              <col style={{ width: "24vw" }} />
              <col style={{ width: "12vw" }} />
              <col style={{ width: "24vw" }} />
            </colgroup>
            <thead>
              <td colSpan={3} className={styles.titleCell}>
                <motion.div
                  style={{
                    minWidth: 0,
                    textAlign: "center",
                    backgroundColor: "#faaf18",
                    color: "var(--light)",
                    whiteSpace: "nowrap",
                  }}
                  variants={titleVariants}
                >
                  Fight Night 2022
                </motion.div>
              </td>
            </thead>
            <br />
            <tbody>
              <motion.tr variants={bodyVariants}>
                <motion.td
                  variants={columnVariants}
                  className={styles.groupColumns}
                >
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                    style={{ backgroundColor: "#ee2222" }}
                  >
                    <td>{team1.name.split(" ").slice(0, 2).join(" ")}</td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                    style={{ backgroundColor: "transparent" }}
                  >
                    {/* <img src={`../public/local/cutouts/${team1.photo}.png`} /> */}
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>{team1.age}</td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>{team1.weight} kg</td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>{team1.height}</td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>{team1.reach}"</td>
                  </motion.tr>
                </motion.td>
                {/*<td className={styles.spacerColumn}></td>*/}
                <motion.td
                  variants={columnVariants}
                  className={styles.groupColumns}
                >
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                    style={{ backgroundColor: "transparent" }}
                  >
                    {/*<td>{team1.name}</td>*/}
                    <td style={{ color: "transparent" }}>
                      {team1.name.split(" ").slice(0, 2).join(" ")}
                    </td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                    style={{
                      backgroundColor: "transparent",
                      // height: "24vh"
                    }}
                  >
                    {/* <td style={{ color: "transparent" }}>Photo</td> */}
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>Age</td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>Weight</td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>Height</td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>Reach</td>
                  </motion.tr>
                </motion.td>
                <motion.td
                  variants={columnVariants}
                  className={styles.groupColumns}
                >
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                    style={{ backgroundColor: "#2222ee" }}
                  >
                    <td>{team2.name.split(" ").slice(0, 2).join(" ")}</td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                    style={{ backgroundColor: "transparent" }}
                  >
                    {/* <img src={`../public/local/cutouts/${team2.photo}.png`} /> */}
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>{team2.age}</td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>{team2.weight} kg</td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>{team2.height}</td>
                  </motion.tr>
                  <motion.tr
                    variants={cellVariants}
                    className={styles.lineupMicroRow}
                  >
                    <td>{team2.reach}"</td>
                  </motion.tr>
                </motion.td>
              </motion.tr>
            </tbody>
          </table>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
