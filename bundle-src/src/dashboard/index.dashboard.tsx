import React from "react";
import ReactDOM from "react-dom";
import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import { Button, MantineProvider, Title } from "@mantine/core";

import { ScoresServiceConnectionState } from "common/types/scoresServiceConnectionState";
import { EventID } from "common/types/eventID";
import { BaseEventType } from "@ystv/scores/src/common/types";
import { NetballDashboard } from "./events/netball";

const SportControllers: Record<string, React.ComponentType> = {
  netball: NetballDashboard,
};

function Dashboard() {
  const connectionState = useOnlyReplicantValue<ScoresServiceConnectionState>(
    "scoresServiceConnectionState",
    undefined,
    {
      defaultValue: "<nodecg is having a moment...>" as any,
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

  const EventController = eventState
    ? SportControllers[eventState.type] ??
      (() => <b>no controller for {eventState.type} ?!</b>)
    : () => null;

  return (
    <div style={{ margin: "1rem 4rem" }}>
      <MantineProvider theme={{}}>
        <Title order={2}>Scores service: {connectionState}</Title>
        <Title order={2}>
          Selected event: {eventID === null ? "<none>" : eventID}
        </Title>
        <Button nodecg-dialog="select-event">Select Event</Button>
        <br />
        <hr style={{ borderTopWidth: "2px", borderColor: "grey" }} />
        <EventController />
      </MantineProvider>
    </div>
  );
}

ReactDOM.render(<Dashboard />, document.getElementById("root"));
