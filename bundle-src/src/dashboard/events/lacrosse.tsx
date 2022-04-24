import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import produce from "immer";

import type { State } from "@ystv/scores/src/common/sports/lacrosse";
import { Container, Title } from "@mantine/core";
import { LiveKillButtons } from "../components/liveKill";
import { ControlLacrosse } from "common/types/control-lacrosse";

export function LacrosseDashboard() {
  const state = useOnlyReplicantValue<State>("eventState");
  const [control, setControl] =
    useReplicantValue<ControlLacrosse>("control-lacrosse");
  console.log(control);
  if (!state) {
    return <b>No state...?!</b>;
  }
  if (!control) {
    return <b>No control...?!</b>;
  }

  return (
    <Container fluid>
      <Title order={3}>Quarter {state.quarters?.length}</Title>
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
        live={control.scoreboard.showTime}
        disabled={!control.scoreboard.visible}
        callback={(live) =>
          setControl(
            produce(control, (val) => {
              val.scoreboard.showTime = live;
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
