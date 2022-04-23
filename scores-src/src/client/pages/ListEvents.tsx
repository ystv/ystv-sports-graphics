import { Link, Outlet } from "react-router-dom";
import { useGETEvents } from "../lib/apiClient";
import {
  Table,
  Card,
  Text,
  Button,
  Title,
  Group,
  Stack,
  TypographyStylesProvider,
} from "@mantine/core";

export function ListEvents() {
  const { data: events, loading, error } = useGETEvents();

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
      <Button component={Link} to="new" mt={"lg"} mb={"lg"} color={"green"}>
        Create New
      </Button>
      <Stack>
        {events.map((evt) => (
          <Card withBorder radius="md" key={evt.id}>
            <Text size="lg" weight={500}>
              {evt.name}
            </Text>
            <Text size="xs" color="dimmed" mt={3} transform="capitalize">
              {evt.type}
            </Text>
            <Text size="xs" color="dimmed" mb="xl">
              {/*TODO replace with date time*/}
              {evt.id}
            </Text>
            <Group>
              <Button
                component={Link}
                to={`${evt.type}/${evt.id}/edit`}
                color={"orange"}
                variant="outline"
              >
                Edit Event
              </Button>
              <Button
                component={Link}
                to={`${evt.type}/${evt.id}`}
                variant="filled"
              >
                Input Scores
              </Button>
              <Button disabled>View Timeline</Button>
            </Group>
          </Card>
        ))}
      </Stack>
      <Outlet />
    </>
  );
}
