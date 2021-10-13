import styles from "./Lineup.module.css";
import { motion, AnimatePresence } from "framer-motion";

export interface LineupProps {
  isVisible: boolean;
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

export function Lineup({ isVisible }: LineupProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="titleSafe"
        >
          <table style={{ fontWeight: 700 }} className={styles.lineupTable}>
            <thead>
              <td colSpan={3} className={styles.titleCell}>
                <motion.div style={{ minWidth: 0 }} variants={titleVariants}>
                  York
                </motion.div>
              </td>
            </thead>
            <tbody>
              <motion.tr variants={bodyVariants}>
                <motion.td
                  variants={columnVariants}
                  className={styles.groupColumns}
                >
                  {team.slice(0, 8).map((e, i) => (
                    <motion.tr
                      variants={cellVariants}
                      className={styles.lineupMicroRow}
                    >
                      <td className={styles.positionNumber}>{i + 1}</td>
                      <td>{e}</td>
                    </motion.tr>
                  ))}
                </motion.td>
                <td className={styles.spacerColumn}></td>
                <motion.td
                  variants={columnVariants}
                  className={styles.groupColumns}
                >
                  {team.slice(8).map((e, i) => (
                    <motion.tr
                      variants={cellVariants}
                      className={styles.lineupMicroRow}
                    >
                      <td className={styles.positionNumber}>{i + 9}</td>
                      <td>{e}</td>
                    </motion.tr>
                  ))}
                </motion.td>
              </motion.tr>
            </tbody>
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
