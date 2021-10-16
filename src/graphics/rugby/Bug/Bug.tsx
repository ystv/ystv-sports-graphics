import styles from "./Bug.module.css";
import { AnimatePresence, motion } from "framer-motion";

export interface BugProps {
  // state: BugState;
  state: boolean;
  liveFrom?: string;
}

export enum BugState {
  Closed,
  LiveFrom,
  Open,
}

export function Bug({ state, liveFrom }: BugProps) {
  const variants = {
    hidden: {
      x: "calc(var(--width) * 1.5)",
      transition: {
        style: "tween",
      },
    },
    visible: {
      x: 0,
      transition: {
        style: "tween",
      },
    },
  };
  const liveVariants = {
    hidden: {
      width: 0,
      minWidth: 0,
      maxWidth: 0,
      padding: 0,
    },
    visible: {
      maxWidth: "fit-content",
      width: "fit-content",
      minWidth: "var(--width)",
      padding: "0 .5vw",
    },
  };
  return (
    // <AnimatePresence>
    //   {state !== BugState.Closed && (
    //     <div className="titleSafe">
    //       <div className={styles.mask}>
    //         {state === BugState.Open && (
    //           <motion.div
    //             initial="hidden"
    //             animate="visible"
    //             exit="hidden"
    //             variants={variants}
    //             className={styles.open}
    //           >
    //             YSTV
    //           </motion.div>
    //         )}
    //         {state === BugState.LiveFrom && (
    //           <motion.div
    //             initial="hidden"
    //             animate="visible"
    //             exit="hidden"
    //             variants={liveVariants}
    //             className={styles.live}
    //           >
    //             Live{liveFrom ? ` from ${liveFrom}` : ""}
    //           </motion.div>
    //         )}
    //       </div>
    //     </div>
    //   )}
    // </AnimatePresence>
    <AnimatePresence>
      {state && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={`titleSafe ${styles.mask}`}
        >
          <motion.div variants={variants} className={styles.open}>
            YSTV
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
