import { motion } from "framer-motion";
import styles from "./index.module.css";

export interface Player {
  name: string;
  designation: string;
}

export interface LineupTableProps {
  home: Player[];
  away: Player[];
  title: string;
  show: boolean;
}

const HeaderVariants = {
  hidden: { width: 0 },
  visible: { width: "auto" },
};

const RegionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.75,
    },
  },
};

const ItemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

// TODO: update for team dictionary
export function LineupTable(props: LineupTableProps) {
  return (
    <motion.div className={styles.Table}>
      <motion.div
        className={styles.Header}
        variants={HeaderVariants}
        initial="hidden"
        animate={props.show ? "visible" : "hidden"}
        transition={{ duration: 1, type: "tween" }}
      >
        <h1 className={styles.HeaderContents}>{props.title}</h1>
      </motion.div>
      <motion.div
        className={styles.Region + " " + styles.Home}
        variants={RegionVariants}
        initial="hidden"
        animate={props.show ? "visible" : "hidden"}
      >
        {props.home.map((player) => (
          <motion.div
            key={player.name + player.designation}
            className={styles.Row}
            variants={ItemVariants}
          >
            <motion.div className={styles.Name}>{player.name}</motion.div>
            <motion.div className={styles.Desig}>
              {player.designation}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
      <motion.div
        className={styles.Region + " " + styles.Away}
        variants={RegionVariants}
        initial="hidden"
        animate={props.show ? "visible" : "hidden"}
      >
        {props.away.map((player) => (
          <motion.div
            key={player.name + player.designation}
            className={styles.Row}
            variants={ItemVariants}
          >
            <motion.div className={styles.Desig}>
              {player.designation}
            </motion.div>
            <motion.div className={styles.Name}>{player.name}</motion.div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
