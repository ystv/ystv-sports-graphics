import styles from "./LowerThird.module.css";
import { AnimatePresence, motion } from "framer-motion";

export interface BugProps {
  isVisible: boolean;
  name: string;
  role?: string;
}

export function LowerThird({ isVisible, name = "", role }: BugProps) {
  const variants = {
    hidden: {
      height: 0,
      y: 100,
      transition: {
        type: "tween",
      },
    },
    visible: {
      y: 0,
      transition: {
        type: "tween",
      },
      height: "var(--height)",
    },
  };
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="titleSafe"
        >
          <div className={styles.container}>
            <motion.div
              className={styles.third}
              variants={variants}
              style={{ borderLeftColor: "var(--light)" }}
            >
              <h2>{name}</h2>
              {role && <h4>{role}</h4>}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
