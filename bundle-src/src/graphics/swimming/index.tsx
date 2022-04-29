import { formatMMSSMS } from "@ystv/scores/src/common/clock";
import { State } from "@ystv/scores/src/common/sports/swimming";
import { ControlSwimming } from "common/types/control-swimming";
import { useOnlyReplicantValue } from "common/useReplicant";
import { motion } from "framer-motion";
import { GraphicContainer } from "../common/container";
import lineupStyles from "./lineup.module.css";
import timesStyles from "./times.module.css";

const POOL_LENGTH_M = 25;

function Times({ run }: { run: State["runs"][number] }) {
  const latestSplit =
    run.splits.length > 0 ? run.splits[run.splits.length - 1] : null;
  if (!latestSplit) {
    return null;
  }
  const ordered = Object.keys(latestSplit.timesByLane).sort(
    (a, b) => latestSplit.timesByLane[a] - latestSplit.timesByLane[b]
  );
  const leadersTime =
    ordered.length > 0 ? latestSplit.timesByLane[ordered[0]] : null;
  const splitIsLast =
    run.splits.length * POOL_LENGTH_M === run.totalDistanceMetres;
  return (
    <motion.div className={timesStyles.Table}>
      {ordered.map((lane, idx) => (
        <motion.div key={idx} className={timesStyles.Row}>
          <motion.span
            className={
              timesStyles.Lane +
              " " +
              (run.swimmersByLane[lane].side === "home"
                ? timesStyles.Home
                : timesStyles.Away)
            }
          >
            <span
              className={
                run.swimmersByLane[lane].side === "home"
                  ? timesStyles.CrestLanc
                  : timesStyles.CrestYork
              }
            />
            {lane}
          </motion.span>
          <motion.span className={timesStyles.Name}>
            {run.swimmersByLane[lane].name.split(" ").slice(1).join(" ")}
          </motion.span>
          <motion.span
            className={
              timesStyles.Time +
              " " +
              (run.swimmersByLane[lane].side === "home"
                ? timesStyles.Home
                : timesStyles.Away)
            }
          >
            {idx > 0 && !splitIsLast && "+"}
            {formatMMSSMS(
              splitIsLast
                ? latestSplit.timesByLane[lane] - run.clock.wallClockLastStarted
                : idx === 0
                ? (leadersTime ?? 0) - run.clock.wallClockLastStarted
                : latestSplit.timesByLane[lane] - (leadersTime ?? 0),
              1,
              2
            )}
          </motion.span>
        </motion.div>
      ))}
    </motion.div>
  );
}

export function AllSwimmingGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control = useOnlyReplicantValue<ControlSwimming>("control-swimming");

  if (!state || !control) {
    return null;
  }

  if (state.currentRun === null) {
    return null;
  }
  const run = state.runs[state.currentRun];

  return (
    <>
      <GraphicContainer>
        {control.lineup.visible && (
          <motion.div className={lineupStyles.Table}>
            <motion.div className={lineupStyles.Header}>
              <motion.h1 className={lineupStyles.HeaderContents}>
                {run.totalDistanceMetres}m {run.style}
              </motion.h1>
            </motion.div>
            <motion.div className={lineupStyles.table}>
              {Object.keys(run.swimmersByLane).map((lane) => (
                <motion.div key={lane} className={lineupStyles.Row}>
                  <motion.span
                    className={
                      lineupStyles.Lane +
                      " " +
                      (run.swimmersByLane[lane].side === "home"
                        ? lineupStyles.Home
                        : lineupStyles.Away)
                    }
                  >
                    <span
                      className={
                        run.swimmersByLane[lane].side === "home"
                          ? lineupStyles.CrestLanc
                          : lineupStyles.CrestYork
                      }
                    />
                    {lane}
                  </motion.span>
                  <motion.span className={lineupStyles.Name}>
                    {run.swimmersByLane[lane].name}
                  </motion.span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </GraphicContainer>
      <GraphicContainer>
        {control.liveTimes.visible && <Times run={run} />}
      </GraphicContainer>
    </>
  );
}
