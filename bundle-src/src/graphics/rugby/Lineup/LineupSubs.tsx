import { AnimatePresence, motion } from "framer-motion";
import styles from "./Lineup.module.css";
import {
  bodyVariants,
  cellVariants,
  columnVariants,
  titleVariants as oldTitleVariants,
} from "./Lineup";
import { TeamDictionary } from "common/teamDictionary";

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
                        style={{
                          backgroundColor:
                            team == 2
                              ? TeamDictionary[sideSubs[i].name].primaryColor
                              : TeamDictionary[sideSubs[team].name]
                                  .primaryColor,
                          color:
                            team == 2
                              ? TeamDictionary[sideSubs[i].name].secondaryColor
                              : TeamDictionary[sideSubs[team].name]
                                  .secondaryColor,
                        }}
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
                          key={e.name}
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
    color: TeamDictionary.york.primaryColor,
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
    color: TeamDictionary.glasgow.primaryColor,
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
