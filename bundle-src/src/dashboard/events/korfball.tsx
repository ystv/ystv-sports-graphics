import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import produce from "immer";

import type { State } from "@ystv/scores/src/common/sports/korfball";
import { ControlKorfball } from "common/types/control-korfball";
import { Container, Title } from "@mantine/core";
import { LiveKillButtons } from "../components/liveKill";

export function KorfballDashboard() {
  const state = useOnlyReplicantValue<State>("eventState");
  const [control, setControl] =
    useReplicantValue<ControlKorfball>("control-korfball");
  console.log(control);
  if (!state) {
    return <b>No state...?!</b>;
  }
  if (!control) {
    return <b>No control...?!</b>;
  }

  return (
    <Container fluid>
      <Title order={3}>Half {state.segment}</Title>
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
        divider
        name="Clock"
        live={control.scoreboard.clock}
        disabled={!control.scoreboard.visible}
        callback={(live) =>
          setControl(
            produce(control, (val) => {
              val.scoreboard.clock = live;
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
