import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import produce from "immer";

import type { State } from "@ystv/scores/src/common/sports/hockey";
import { Container, Title } from "@mantine/core";
import { LiveKillButtons } from "../components/liveKill";
import { ControlRosesFencing } from "common/types/control-rosesFencing";

export function RosesFencingDashboard() {
  const state = useOnlyReplicantValue<State>("eventState");
  const [control, setControl] = useReplicantValue<ControlRosesFencing>(
    "control-rosesFencing"
  );
  console.log(control);
  if (!state) {
    return <b>No state...?!</b>;
  }
  if (!control) {
    return <b>No control...?!</b>;
  }

  return (
    <Container fluid>
      <Title order={3}>Bout {state.segment}</Title>
      <LiveKillButtons
        name="Scoreboard"
        live={control.scoreboard.visible}
        callback={(live) =>
          setControl(
            produce(control, (val) => {
              val.scoreboard.visible = live;
            })
          )
        }
      />
      <LiveKillButtons
        name="Match Status Popup"
        live={control.matchStatusPopup.visible}
        callback={(live) =>
          setControl(
            produce(control, (val) => {
              val.matchStatusPopup.visible = live;
            })
          )
        }
      />
    </Container>
  );
}
