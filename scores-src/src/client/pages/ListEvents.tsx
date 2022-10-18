import { Link, Outlet } from "react-router-dom";
import {
  useGETEvents,
  useGETLeagues,
  usePOSTEventResync,
} from "../lib/apiClient";
import {
  Table,
  Card,
  Text,
  Button,
  Title,
  Group,
  Stack,
  TypographyStylesProvider,
  ActionIcon,
  Select,
} from "@mantine/core";
import dayjs from "dayjs";
import { PermGate } from "../components/PermGate";
import { IconRefresh } from "@tabler/icons";
import { useState } from "react";
import { showNotification } from "@mantine/notifications";
import { EVENT_TYPES } from "../../common/sports";

function EventsList(props: { league: string }) {
  const { data: events, loading, error } = useGETEvents(props.league, true);

  const doResync = usePOSTEventResync();
  const [resyncing, setResyncing] = useState<string | null>(null);
  async function resync(type: string, id: string) {
    setResyncing(`Event/${type}/${id}`);
    try {
      await doResync(type, id);
      showNotification({
        message: "Resynced!",
        color: "blue",
      });
    } catch (e) {
      let msg: string;
      if (e instanceof Error) {
        msg = e.name + " " + e.message;
      } else {
        msg = String(e);
      }
      showNotification({
        message: msg,
        color: "red",
      });
    } finally {
      setResyncing(null);
    }
  }

  return (
    <>
      {error && <b>Error! {error}</b>}
      {loading && <b>Loading, please wait...</b>}
      {events.map((evt) => (
        <Card withBorder radius="md" key={evt.id} data-cy="eventRoot">
          <Text size="lg" weight={500}>
            {evt.name}
          </Text>
          <Text size="xs" color="dimmed" mt={3} transform="capitalize">
            {evt.type}
          </Text>
          {evt.winner && (
            <Text size="xs" weight="bold">
              Winner:{" "}
              {evt.winner === "home" ? evt.homeTeam.name : evt.awayTeam.name}
            </Text>
          )}
          <Text size="xs" color="dimmed" mb="xl">
            {dayjs(evt.startTime).format("dddd DD MMM, HH:mm")}
          </Text>
          <Group>
            <PermGate require="write" fallback={<></>}>
              <Button
                component={Link}
                to={`${evt.type}/${evt.id}/edit`}
                color={"orange"}
                variant="outline"
                disabled={!(evt.type in EVENT_TYPES)}
                data-cy="editEvent"
              >
                Edit Event
              </Button>
            </PermGate>
            <Button
              component={Link}
              to={`${evt.type}/${evt.id}`}
              variant="filled"
              disabled={!(evt.type in EVENT_TYPES)}
            >
              Input Scores
            </Button>
            <Button disabled>View Timeline</Button>
            <PermGate require="admin" fallback={<></>}>
              <ActionIcon
                onClick={() => resync(evt.type, evt.id)}
                loading={resyncing === `Event/${evt.type}/${evt.id}`}
                disabled={resyncing !== null}
              >
                <IconRefresh size={24} />
              </ActionIcon>
            </PermGate>
          </Group>
        </Card>
      ))}
    </>
  );
}

export function ListEvents() {
  const { data: leagues, loading, error } = useGETLeagues();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  if (loading) {
    return (
      <div>
        <h1>Loading, please to waiting...</h1>
      </div>
    );
  }

  if (error) {
    console.dir(error);
    let message;
    if (error instanceof Error) {
      message = error.name + ": " + error.message;
      if ("status" in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message += ` [status: ${(error as any).status}]`;
      }
      if ("stack" in error) {
        message += "\n" + error.stack;
      }
      if ("cause" in error) {
        message += "\n" + error.cause;
      }
    } else {
      message = JSON.stringify(error);
    }
    return (
      <TypographyStylesProvider>
        <h1>Sorry, something went wrong!</h1>
        <p>
          Please check your network connection and try again. If you still have
          problems, please send a screenshot of this screen to the Graphics
          Team.
        </p>
        <code>{message}</code>
      </TypographyStylesProvider>
    );
  }

  return (
    <>
      <Title order={1}>All Events</Title>
      <Button
        component={Link}
        to="new"
        mt={"lg"}
        mb={"lg"}
        color={"green"}
        data-cy="createNew"
      >
        Create New
      </Button>
      <Stack>
        <Select
          value={selectedLeague}
          onChange={(v) => setSelectedLeague(v)}
          data={leagues.map((l) => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            value: l.slug!,
            label: l.name,
          }))}
        />
        {selectedLeague !== null && <EventsList league={selectedLeague} />}
      </Stack>
      <Outlet />
    </>
  );
}
