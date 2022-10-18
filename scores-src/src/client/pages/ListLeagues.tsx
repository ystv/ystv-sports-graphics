import {
  Title,
  Loader,
  TypographyStylesProvider,
  Button,
  Stack,
  Card,
  Group,
  Modal,
  Text,
} from "@mantine/core";
import { useState } from "react";
import { League } from "../../common/types";
import { CreateTeamModalContents } from "../components/TeamSelect";
import { useGETLeagues } from "../lib/apiClient";

function EditLeagueModalContents(props: {
  initialState: League;
  close: () => void;
  // FIXME
  // eslint-disable-next-line @typescript-eslint/no-empty-function
}) {}

export function ListLeaguesScreen() {
  const { data, error, loading } = useGETLeagues();

  const [showCreate, setShowCreate] = useState(false);

  const [editing, setEditing] = useState<League | null>(null);

  if (loading) {
    return (
      <div>
        <Title order={1}>Loading, please wait...</Title>
        <Loader />
      </div>
    );
  }

  if (error) {
    let message;
    if (error instanceof Error) {
      message = error.message;
      if ("status" in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message += ` [status: ${(error as any).status}]`;
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
      <Title order={1}>Teams</Title>
      <Button
        onClick={() => setShowCreate(true)}
        mt={"lg"}
        mb={"lg"}
        color={"green"}
        data-cy="createNew"
      >
        Create New
      </Button>
      <Stack>
        {data.map((league) => (
          <Card withBorder radius="md" key={league.slug}>
            <Text size="lg" weight={500} inline>
              {league.name}
            </Text>

            <Group>
              <Button
                onClick={() => setEditing(league)}
                color={"blue"}
                variant="outline"
              >
                Edit
              </Button>
            </Group>
          </Card>
        ))}
      </Stack>
      <Modal opened={showCreate} onClose={() => setShowCreate(false)}>
        <Title order={1}>Create Team</Title>
        {showCreate && (
          <CreateTeamModalContents close={() => setShowCreate(false)} />
        )}
      </Modal>
      <Modal opened={editing !== null} onClose={() => setEditing(null)}>
        {editing !== null && (
          <>
            <Title order={1}>Editing {editing.name}</Title>
            <EditLeagueModalContents
              initialState={editing}
              close={() => setEditing(null)}
            />
          </>
        )}
      </Modal>
    </>
  );
}
