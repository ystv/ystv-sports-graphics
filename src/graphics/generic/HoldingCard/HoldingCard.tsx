import styles from "./HoldingCard.module.css";
import { AnimatePresence, motion } from "framer-motion";

export interface HoldingCardProps {
  isVisible: boolean;
  isUnbranded: boolean;
  text?: string;
}

export function HoldingCard({
  isVisible = false,
  isUnbranded = false,
  text = "",
}: HoldingCardProps) {
  const variants = {
    hidden: {
      opacity: "0%",
      transition: {
        when: "afterChildren",
      },
    },
    visible: {
      opacity: "100%",
      transition: {
        when: "beforeChildren",
      },
    },
  };
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
          className={styles.backgroundImage}
          style={{
            backgroundImage: isUnbranded
              ? "url(../public/HoldingCard/GenericHoldingCard.jpg)"
              : "url(../public/HoldingCard/YSTVSportHoldingCard.png)",
          }}
        >
          <div className={`titleSafePadding ${styles.flexBottom}`}>
            <motion.div className={styles.third} variants={variants}>
              <motion.h4 variants={variants}>Stream starts soon</motion.h4>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
