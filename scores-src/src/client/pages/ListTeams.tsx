import {
  Button,
  Card,
  Loader,
  Stack,
  Title,
  TypographyStylesProvider,
  Text,
  Group,
  Modal,
  Alert,
} from "@mantine/core";
import { TeamInfo, TeamInfoSchema } from "../../common/types";
import { useGETTeams, usePOSTTeams, usePUTTeams } from "../lib/apiClient";
import { useState } from "react";
import { Form, Formik, FormikHelpers } from "formik";
import {
  CreateEditTeamFields,
  CreateTeamModalContents,
} from "../components/TeamSelect";

export function EditTeamModalContents(props: {
  initialState: TeamInfo;
  close: () => unknown;
}) {
  const schema = TeamInfoSchema.omit(["slug", "crestAttachmentID"]);
  const [crestFile, setCrestFile] = useState<File | null>(null);
  const doEdit = usePUTTeams();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function create(values: TeamInfo, helpers: FormikHelpers<TeamInfo>) {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await doEdit(props.initialState.slug, values, crestFile ?? undefined);
      props.close();
    } catch (e) {
      setSubmitError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Formik
      validationSchema={schema}
      initialValues={schema.cast(props.initialState)}
      onSubmit={create}
    >
      {({ errors, handleSubmit }) => (
        <Form data-cy="createTeam">
          <CreateEditTeamFields setCrestFile={setCrestFile} />
          <Button
            onClick={() => handleSubmit()}
            disabled={submitting}
            data-cy="submit"
          >
            Save
          </Button>
          {submitError !== null && <Alert>Could not save! {submitError}</Alert>}
          {import.meta.env.DEV && (
            <code data-cy="errors">{JSON.stringify(errors)}</code>
          )}
        </Form>
      )}
    </Formik>
  );
}

export function ListTeamsScreen() {
  const { data, error, loading } = useGETTeams();

  const [showCreate, setShowCreate] = useState(false);

  const [editing, setEditing] = useState<TeamInfo | null>(null);

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
        {data.map((team) => (
          <Card withBorder radius="md" key={team.slug}>
            <Text size="lg" weight={500} inline>
              {team.name}&nbsp;
              <Text
                size="lg"
                weight={400}
                transform="uppercase"
                component="span"
              >
                ({team.abbreviation})
              </Text>
            </Text>

            <Group>
              <Button
                onClick={() => setEditing(team)}
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
            <EditTeamModalContents
              initialState={editing}
              close={() => setEditing(null)}
            />
          </>
        )}
      </Modal>
    </>
  );
}
