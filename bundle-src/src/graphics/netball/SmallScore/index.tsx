import { RenderClock } from "@ystv/scores/src/common/components/Clock";
import { ValueType } from "@ystv/scores/src/common/sports/netball";
import { ControlNetball } from "common/types/control:netball";
import { motion, AnimatePresence } from "framer-motion";

export interface NetballSmallScoreProps {
  value: ValueType;
  control: ControlNetball;
}

export function NetballSmallScore(props: NetballSmallScoreProps) {
  const data = props.value;
  const currentQuarter =
    data.quarters.length > 0 && data.quarters[data.quarters.length - 1];
  const control = props.control.smallScore;

  const scoreHome = data.quarters
    .flatMap((x) => x.goals)
    .filter((x) => x.side === "home").length;
  const scoreAway = data.quarters
    .flatMap((x) => x.goals)
    .filter((x) => x.side === "away").length;

  return (
    <AnimatePresence>
      {control.visible && (
        <motion.div
          style={{
            position: "fixed",
            bottom: "calc(54px + 0.1rem)",
            left: "calc(96px + 0.1rem)",
            backgroundColor: "#333",
            color: "white",
            padding: "0.2em",
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            justifyContent: "space-between",
            minWidth: "15rem",
            fontSize: "24pt",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.span style={{ margin: "0 0.2em" }}>{scoreHome}</motion.span>
          <motion.span style={{ margin: "0 0.2em" }}>LANCS</motion.span>
          <motion.span style={{ margin: "0 0.2em" }}>YORK</motion.span>
          <motion.span style={{ margin: "0 0.2em" }}>{scoreAway}</motion.span>
          <motion.span style={{ margin: "0 0.2em" }}>
            <RenderClock clock={data.clock} precisionMs={0} precisionHigh={2} />
          </motion.span>
          <motion.span style={{ margin: "0 0.2em" }}>
            Q{data.quarters.length}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
