import styles from "./Lineup.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { TeamDictionary } from "../../../common/teamDictionary";

export interface LineupProps {
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

export function Lineup({ isVisible, lineupTeam = 0 }: LineupProps) {
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
                <motion.div
                  style={{
                    minWidth: 0,
                    backgroundColor:
                      TeamDictionary[teams[lineupTeam].name].primaryColor,
                    color:
                      TeamDictionary[teams[lineupTeam].name].secondaryColor,
                  }}
                  variants={titleVariants}
                >
                  {teams[lineupTeam].name}
                </motion.div>
              </td>
            </thead>
            <tbody>
              <motion.tr variants={bodyVariants}>
                <motion.td
                  variants={columnVariants}
                  className={styles.groupColumns}
                >
                  {teams[lineupTeam].team.slice(0, 8).map((e, i) => (
                    <motion.tr
                      key={e.name}
                      variants={cellVariants}
                      className={styles.lineupMicroRow}
                    >
                      <td className={styles.positionNumber}>{i + 1}</td>
                      <td>
                        {e.name}
                        {e.captain ? " (C)" : ""}
                      </td>
                    </motion.tr>
                  ))}
                </motion.td>
                <td className={styles.spacerColumn}></td>
                <motion.td
                  variants={columnVariants}
                  className={styles.groupColumns}
                >
                  {teams[lineupTeam].team.slice(8).map((e, i) => (
                    <motion.tr
                      key={e.name}
                      variants={cellVariants}
                      className={styles.lineupMicroRow}
                    >
                      <td className={styles.positionNumber}>{i + 9}</td>
                      <td>
                        {e.name}
                        {e.captain ? " (C)" : ""}
                      </td>
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

const teams = [
  {
    name: "york",
    team: [
      { name: "Marcia Harmon" },
      { name: "Samantha Wiley" },
      { name: "Mildred Spencer" },
      { name: "Lorna Stout" },
      { name: "Gabrielle Munoz", captain: true },
      { name: "Marissa Singleton" },
      { name: "Yolanda Peck" },
      { name: "Shelly Odonnell" },
      { name: "Hope Patton" },
      { name: "Maxine Kemp" },
      { name: "Ruby Elliott" },
      { name: "Gay Garrison" },
      { name: "Lolita Best" },
      { name: "Mariana Bonilla" },
      { name: "Dorothea Mcclure" },
    ],
  },
  {
    name: "glasgow",
    team: [
      { name: "Marcia Harmon" },
      { name: "Samantha Wiley" },
      { name: "Mildred Spencer" },
      { name: "Lorna Stout" },
      { name: "Gabrielle Munoz" },
      { name: "Marissa Singleton" },
      { name: "Yolanda Peck" },
      { name: "Shelly Odonnell" },
      { name: "Hope Patton" },
      { name: "Maxine Kemp" },
      { name: "Ruby Elliott", captain: true },
      { name: "Gay Garrison" },
      { name: "Lolita Best" },
      { name: "Mariana Bonilla" },
      { name: "Dorothea Mcclure" },
    ],
  },
];
