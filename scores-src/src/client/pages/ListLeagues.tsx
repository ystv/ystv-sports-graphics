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
import { Form, Formik, FormikHelpers, useFormikContext } from "formik";
import { useState } from "react";
import useSWR from "swr";
import { DateField, Field } from "../../common/formFields";
import { League, LeagueSchema } from "../../common/types";
import { CreateTeamModalContents } from "../components/TeamSelect";
import { useGETLeagues, usePOSTLeagues, usePUTLeague } from "../lib/apiClient";

function EditLeagueFields() {
  return (
    <>
      <Field name="name" title="Name" />
      <DateField name="startDate" title="Start Date" format="isoStr" />
      <DateField name="endDate" title="Start Date" format="isoStr" />
    </>
  );
}

function CreateLeagueModal(props: { close: () => unknown }) {
  const doCreate = usePOSTLeagues();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function create(values: League, helpers: FormikHelpers<League>) {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await doCreate(values);
      props.close();
    } catch (e) {
      setSubmitError(String(e));
    }
  }

  return (
    <Formik
      validationSchema={LeagueSchema}
      initialValues={{
        name: "",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      }}
      onSubmit={create}
    >
      {({ handleSubmit }) => (
        <Form data-cy="createLeague">
          <EditLeagueFields />
          <Button
            onClick={() => handleSubmit()}
            disabled={submitting}
            data-cy="submit"
          >
            Create
          </Button>
        </Form>
      )}
    </Formik>
  );
}

function EditLeagueModal(props: {
  initialState: League;
  close: () => unknown;
}) {
  const doEdit = usePUTLeague();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function create(values: League, helpers: FormikHelpers<League>) {
    try {
      setSubmitting(true);
      setSubmitError(null);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await doEdit(props.initialState.slug!, values);
      props.close();
    } catch (e) {
      setSubmitError(String(e));
    }
  }

  return (
    <Formik
      validationSchema={LeagueSchema}
      initialValues={props.initialState}
      onSubmit={create}
    >
      {({ handleSubmit }) => (
        <Form data-cy="createLeague">
          <EditLeagueFields />
          <Button
            onClick={() => handleSubmit()}
            disabled={submitting}
            data-cy="submit"
          >
            Save
          </Button>
        </Form>
      )}
    </Formik>
  );
}

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
      <Title order={1}>Leagues</Title>
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
        <Title order={1}>Create League</Title>
        {showCreate && <CreateLeagueModal close={() => setShowCreate(false)} />}
      </Modal>
      <Modal opened={editing !== null} onClose={() => setEditing(null)}>
        {editing !== null && (
          <>
            <Title order={1}>Editing {editing.name}</Title>
            <EditLeagueModal
              initialState={editing}
              close={() => setEditing(null)}
            />
          </>
        )}
      </Modal>
    </>
  );
}
