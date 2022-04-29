import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import produce from "immer";

import type { State } from "@ystv/scores/src/common/sports/swimming";
import { ControlSwimming } from "common/types/control-swimming";
import { Container, Title } from "@mantine/core";
import { LiveKillButtons } from "../components/liveKill";

export function SwimmingDashboard() {
  const state = useOnlyReplicantValue<State>("eventState");
  const [control, setControl] =
    useReplicantValue<ControlSwimming>("control-swimming");
  console.log(control);
  if (!state) {
    return <b>No state...?!</b>;
  }
  if (!control) {
    return <b>No control...?!</b>;
  }

  const currentRun =
    state.currentRun !== null ? state.runs[state.currentRun] : null;

  return (
    <Container fluid>
      <strong>
        {currentRun !== null
          ? `Next: ${currentRun.totalDistanceMetres}m ${currentRun.style}`
          : "No next run selected! (this is a graphics op thing)"}
      </strong>
      <LiveKillButtons
        name="Line-up"
        live={control.lineup.visible}
        divider
        callback={(live) =>
          setControl(
            produce(control, (val) => {
              val.lineup.visible = live;
            })
          )
        }
      />
      <LiveKillButtons
        name="Live Times"
        live={control.liveTimes.visible}
        callback={(live) =>
          setControl(
            produce(control, (val) => {
              val.liveTimes.visible = live;
            })
          )
        }
      />
    </Container>
  );
}
