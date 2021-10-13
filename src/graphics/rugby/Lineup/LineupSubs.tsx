import { AnimatePresence, motion } from "framer-motion";
import styles from "./Lineup.module.css";
import {
  bodyVariants,
  cellVariants,
  columnVariants,
  titleVariants as oldTitleVariants,
} from "./Lineup";

const titleVariants = {
  hidden: {
    ...oldTitleVariants.hidden,
    transition: {
      ...oldTitleVariants.hidden.transition,
      delay: 0.6,
    },
  },
  visible: {
    ...oldTitleVariants.visible,
    maxWidth: "40vw",
  },
};

export interface LineupSubsProps {
  isVisible: boolean;
  team: number;
}

export function LineupSubs({ isVisible = false, team = 0 }: LineupSubsProps) {
  let sides;
  if (team == 2) {
    sides = sideSubs;
  } else {
    sides = [sideSubs[team]];
  }
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="titleSafe"
          initial="hidden"
          exit="hidden"
          animate="visible"
        >
          <table style={{ fontWeight: 700 }} className={styles.lineupTable}>
            <thead>
              <motion.tr
                variants={{
                  hidden: {
                    transition: {
                      staggerDirection: -1,
                      staggerChildren: 0.5,
                    },
                  },
                  visible: {
                    transition: { staggerChildren: 0.5 },
                  },
                }}
                style={{ textAlign: "center" }}
              >
                {sides.map((e, i) => (
                  <>
                    {i == 1 && <td />}
                    <motion.td className={styles.titleCell}>
                      <motion.div
                        style={{ backgroundColor: e.color }}
                        variants={titleVariants}
                        transition={{ delay: 0.4 }}
                        key={"title" + i}
                      >
                        {e.name}
                      </motion.div>
                    </motion.td>
                  </>
                ))}
              </motion.tr>
            </thead>
            <tbody>
              <motion.tr variants={bodyVariants}>
                {sides.map((side, i) => (
                  <>
                    {i == 1 && <td className={styles.spacerColumn} />}
                    <motion.td
                      className={styles.groupColumns}
                      variants={columnVariants}
                    >
                      {side.team.map((e, i) => (
                        <motion.tr
                          className={styles.lineupMicroRow}
                          variants={cellVariants}
                        >
                          <td className={styles.positionNumber}>{i + 16}</td>
                          <td>{e.name}</td>
                        </motion.tr>
                      ))}
                    </motion.td>
                  </>
                ))}
              </motion.tr>
            </tbody>
          </table>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const sideSubs = [
  {
    name: "york",
    color: "#faaf18",
    team: [
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
    color: "#002542",
    team: [
      { name: "Marcia Harmon" },
      { name: "Samantha Wiley" },
      { name: "Mildred Spencer" },
      { name: "Lorna Stout" },
      { name: "Marissa Singleton" },
      { name: "Yolanda Peck" },
      { name: "Shelly O'donnell" },
    ],
  },
];
