import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import produce from "immer";

import type { State } from "@ystv/scores/src/common/sports/football";
import { ControlFootball } from "common/types/control-football";
import { Container, Title } from "@mantine/core";
import { LiveKillButtons } from "../components/liveKill";

export function FootballDashboard() {
  const state = useOnlyReplicantValue<State>("eventState");
  const [control, setControl] = useReplicantValue<ControlFootball>(
    "control-football",
    undefined,
    {
      defaultValue: {
        scoreboard: {
          visible: false,
        },
      },
    }
  );
  if (!state) {
    return <b>No state...?!</b>;
  }

  return (
    <Container fluid>
      <Title order={3}>Half {state.halves.length}</Title>
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
    </Container>
  );
}
