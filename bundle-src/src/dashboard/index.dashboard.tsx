import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import { Button, Group, MantineProvider, Title } from "@mantine/core";

import { ScoresServiceConnectionState } from "common/types/scoresServiceConnectionState";
import { EventID } from "common/types/eventID";

const LiveButton = ({ callback }: { callback: Function }) => (
  <Button onClick={() => callback(true)} color="green">
    LIVE
  </Button>
);

const KillButton = ({ callback }: { callback: Function }) => (
  <Button onClick={() => callback(false)} color="red">
    KILL
  </Button>
);

const LiveKillButtons = ({
  name,
  live,
  callback,
  children,
}: {
  name: string;
  live: boolean;
  callback: Function;
  children?: JSX.Element;
}) => (
  <>
    <Title order={2}>{name}</Title>
    <strong>Status: {live ? "LIVE" : "HIDDEN"}</strong>
    <br />
    <Group>
      <LiveButton callback={callback} />
      <KillButton callback={callback} />
    </Group>
    {children}
    <br />
    <br />
    <hr style={{ borderTopWidth: "2px", borderColor: "grey" }} />
  </>
);

// function Dashboard() {
//   return <h1>Hi</h1>;
// }

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
      </MantineProvider>
    </div>
  );
}

ReactDOM.render(<Dashboard />, document.getElementById("root"));
