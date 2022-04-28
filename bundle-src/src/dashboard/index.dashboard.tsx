import React from "react";
import ReactDOM from "react-dom";
import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import { Button, MantineProvider, Title } from "@mantine/core";

import { ScoresServiceConnectionState } from "common/types/scoresServiceConnectionState";
import { EventID } from "common/types/eventID";
import { BaseEventType } from "@ystv/scores/src/common/types";
import { NetballDashboard } from "./events/netball";
import { FootballDashboard } from "./events/football";
import { BasketballDashboard } from "./events/basketball";
import { LacrosseDashboard } from "./events/lacrosse";
import { UltimateDashboard } from "./events/ultimate";
import { WaterpoloDashboard } from "./events/waterpolo";
import { RugbyUnionDashboard } from "./events/rugbyUnion";
import { AmericanFootballDashboard } from "./events/americanFootball";
import { BadmintonDashboard } from "./events/badminton";
import { CanoePoloDashboard } from "./events/canoePolo";

const SportControllers: Record<string, React.ComponentType> = {
  netball: NetballDashboard,
  football: FootballDashboard,
  basketball: BasketballDashboard,
  lacrosse: LacrosseDashboard,
  ultimate: UltimateDashboard,
  waterpolo: WaterpoloDashboard,
  rugbyUnion: RugbyUnionDashboard,
  americanFootball: AmericanFootballDashboard,
  badminton: BadmintonDashboard,
  canoePolo: CanoePoloDashboard,
};

function Dashboard() {
  const connectionState = useOnlyReplicantValue<ScoresServiceConnectionState>(
    "scoresServiceConnectionState",
    undefined,
    {
      // @ts-expect-error explicitly not one of the valid values, just for display
      defaultValue: "<nodecg is having a moment...>",
    }
  );

  const [eventID, setEventID] = useReplicantValue<EventID>(
    "eventID",
    undefined,
    {
      defaultValue: null,
    }
  );
  const eventState = useOnlyReplicantValue<BaseEventType | null>(
    "eventState",
    undefined,
    {
      defaultValue: null,
    }
  );
  let type = "";
  if (eventID) {
    const [_, typeVal] = eventID.split("/");
    type = typeVal;
  }

  const EventController = eventState
    ? SportControllers[type] ?? (() => <b>no controller for {type}?!</b>)
    : () => null;

  return (
    <div style={{ margin: "1rem 4rem" }}>
      <MantineProvider theme={{}}>
        <Title order={2}>Scores service: {connectionState}</Title>
        <Title order={2}>
          Selected event: {eventID === null ? "<none>" : eventID}
        </Title>
        <Button nodecg-dialog="select-event">Select Event</Button>
        <Button onClick={() => nodecg.sendMessage("resync")} color="orange">
          Resync
        </Button>
        <br />
        <hr style={{ borderTopWidth: "2px", borderColor: "grey" }} />
        <EventController />
      </MantineProvider>
    </div>
  );
}

ReactDOM.render(<Dashboard />, document.getElementById("root"));
