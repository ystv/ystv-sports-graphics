import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import produce from "immer";

import type { ValueType } from "@ystv/scores/src/common/sports/netball";
import { ControlNetball } from "common/types/control-netball";
import { Container, Title } from "@mantine/core";
import { LiveKillButtons } from "../components/liveKill";

export function NetballDashboard() {
  const state = useOnlyReplicantValue<ValueType>("eventState");
  const [control, setControl] = useReplicantValue<ControlNetball>(
    "control-netball",
    undefined,
    {
      defaultValue: {
        smallScore: {
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
      <Title order={3}>Quarter {state.quarters.length}</Title>
      <LiveKillButtons
        name="Small Score"
        live={control.smallScore.visible}
        callback={(live) =>
          setControl(
            produce(control, (val) => {
              val.smallScore.visible = live;
            })
          )
        }
      />
    </Container>
  );
}
