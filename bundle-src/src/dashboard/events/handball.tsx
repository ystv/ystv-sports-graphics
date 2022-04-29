import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import produce from "immer";

import type { State } from "@ystv/scores/src/common/sports/handball";
import { ControlHandball } from "common/types/control-handball";
import { Container, Title } from "@mantine/core";
import { LiveKillButtons } from "../components/liveKill";

export function HandballDashboard() {
  const state = useOnlyReplicantValue<State>("eventState");
  const [control, setControl] =
    useReplicantValue<ControlHandball>("control-handball");
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
        divider
        callback={(live) =>
          setControl(
            produce(control, (val) => {
              val.matchStatusPopup.visible = live;
            })
          )
        }
      />
      <LiveKillButtons
        name="Lineup"
        live={control.lineup.visible}
        callback={(live) =>
          setControl(
            produce(control, (val) => {
              val.lineup.visible = live;
            })
          )
        }
      />
      <LiveKillButtons
        name="Substitutes vs Starting Players"
        live={control.lineup.substitutes}
        disabled={!control.lineup.visible}
        callback={(live) =>
          setControl(
            produce(control, (val) => {
              val.lineup.substitutes = live;
            })
          )
        }
      />
    </Container>
  );
}
