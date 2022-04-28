import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import produce from "immer";

import type { State } from "@ystv/scores/src/common/sports/volleyball";
import { Container, Title } from "@mantine/core";
import { LiveKillButtons } from "../components/liveKill";
import { ControlVolleyball } from "common/types/control-volleyball";

export function VolleyballDashboard() {
  const state = useOnlyReplicantValue<State>("eventState");
  const [control, setControl] =
    useReplicantValue<ControlVolleyball>("control-volleyball");
  console.log(control);
  if (!state) {
    return <b>No state...?!</b>;
  }
  if (!control) {
    return <b>No control...?!</b>;
  }

  return (
    <Container fluid>
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
