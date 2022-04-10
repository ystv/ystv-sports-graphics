import { ControlRugbyUnion } from "common/types/control-rugbyUnion";
import type { State } from "@ystv/scores/src/common/sports/rugbyUnion";
import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import { Container, Title } from "@mantine/core";
import produce from "immer";
import { LiveKillButtons } from "../components/liveKill";

export function RugbyUnionDashboard() {
  const state = useOnlyReplicantValue<State>("eventState");
  const [control, setControl] = useReplicantValue<ControlRugbyUnion>(
    "control-rugbyUnion",
    undefined,
    {
      defaultValue: {
        scoreboard: {
          visible: false,
          timerShown: false,
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
      {control.scoreboard.visible && (
        <LiveKillButtons
          name="Timer"
          live={control.scoreboard.timerShown}
          callback={(live) =>
            setControl(
              produce(control, (val) => {
                val.scoreboard.timerShown = live;
              })
            )
          }
        />
      )}
    </Container>
  );
}
