import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import produce from "immer";

import type { State } from "@ystv/scores/src/common/sports/tableTennis";
import { ControlTableTennis } from "common/types/control-tableTennis";
import { Container, Title } from "@mantine/core";
import { LiveKillButtons } from "../components/liveKill";

export function TableTennisDashboard() {
  const state = useOnlyReplicantValue<State>("eventState");
  const [control, setControl] = useReplicantValue<ControlTableTennis>(
    "control-tableTennis"
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
      <Title order={3}>Game {state.games.length}</Title>
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
