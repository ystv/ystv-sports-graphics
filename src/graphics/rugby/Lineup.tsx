import styles from "./Lineup.module.css";
import { motion, AnimatePresence } from "framer-motion";

export interface LineupProps {
  isVisible: boolean;
}

export function Lineup({ isVisible }: LineupProps) {
  const variants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="titleSafe"
        >
          <table style={{ fontWeight: 700 }} className={styles.lineupTable}>
            <tr>
              <td colSpan={3} className={styles.titleCell}>
                <div>York</div>
              </td>
            </tr>
            <tr>
              <td className={styles.groupColumns}>
                {team.slice(0, 8).map((e, i) => (
                  <tr className={styles.lineupMicroRow}>
                    <td className={styles.positionNumber}>{i + 1}</td>
                    <td>{e}</td>
                  </tr>
                ))}
              </td>
              <td className={styles.spacerColumn}></td>
              <td className={styles.groupColumns}>
                {team.slice(8).map((e, i) => (
                  <tr className={styles.lineupMicroRow}>
                    <td className={styles.positionNumber}>{i + 9}</td>
                    <td>{e}</td>
                  </tr>
                ))}
              </td>
            </tr>
          </table>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const team = [
  "Marcia Harmon",
  "Samantha Wiley",
  "Mildred Spencer",
  "Lorna Stout",
  "Gabrielle Munoz",
  "Marissa Singleton",
  "Yolanda Peck",
  "Shelly Odonnell",
  "Hope Patton",
  "Maxine Kemp",
  "Ruby Elliott",
  "Gay Garrison",
  "Lolita Best",
  "Mariana Bonilla",
  "Dorothea Mcclure",
];
