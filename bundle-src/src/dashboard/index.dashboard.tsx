import React from "react";
import ReactDOM from "react-dom";
import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import { Button, MantineProvider, Title } from "@mantine/core";

import { ScoresServiceConnectionState } from "common/types/scoresServiceConnectionState";
import { EventID } from "common/types/eventID";
import { EventMeta } from "@ystv/scores/src/common/types";
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
import { FutsalDashboard } from "./events/futsal";
import { HandballDashboard } from "./events/handball";
import { TableTennisDashboard } from "./events/tableTennis";
import { VolleyballDashboard } from "./events/volleyball";
import { HockeyDashboard } from "./events/hockey";
import { SwimmingDashboard } from "./events/swimming";
import { KorfballDashboard } from "./events/korfball";
import { OctopushDashboard } from "./events/octopush";
import { RosesFencingDashboard } from "./events/rosesFencing";

const SportControllers: Record<string, React.ComponentType> = {
  netball: NetballDashboard,
  football: FootballDashboard,
  basketball: BasketballDashboard,
  lacrosse: LacrosseDashboard,
  ultimate: UltimateDashboard,
  waterpolo: WaterpoloDashboard,
  hockey: HockeyDashboard,
  rugbyUnion: RugbyUnionDashboard,
  americanFootball: AmericanFootballDashboard,
  badminton: BadmintonDashboard,
  canoePolo: CanoePoloDashboard,
  futsal: FutsalDashboard,
  handball: HandballDashboard,
  tableTennis: TableTennisDashboard,
  volleyball: VolleyballDashboard,
  swimming: SwimmingDashboard,
  korfball: KorfballDashboard,
  octopush: OctopushDashboard,
  rosesFencing: RosesFencingDashboard,
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
  const eventMeta = useOnlyReplicantValue<EventMeta | null>(
    "eventState",
    undefined,
    {
      defaultValue: null,
    }
  );
  let type = "";
  if (eventID) {
    const [_, _league, typeVal] = eventID.split("/");
    type = typeVal;
  }

  const EventController = eventMeta
    ? SportControllers[type] ?? (() => <b>no controller for {type}?!</b>)
    : () => null;

  return (
    <div style={{ margin: "1rem 4rem" }}>
      <MantineProvider theme={{}}>
        <Title order={2}>Scores service: {connectionState}</Title>
        <Title order={2}>
          Selected event:{" "}
          {eventID === null
            ? "<none>"
            : eventMeta === null
            ? "<no meta?>"
            : eventMeta.name}
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
