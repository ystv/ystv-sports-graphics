import { Alert, Button, Modal, Select, Stack, Title } from "@mantine/core";
import { Form as FormikForm, Formik, FormikHelpers } from "formik";
import { ChangeEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateField, Field } from "../../common/formFields";
import { EVENT_COMPONENTS, EVENT_TYPES } from "../../common/sports";
import {
  EventCreateEditSchema,
  EventMeta,
  EventMetaSchema,
} from "../../common/types";
import { TeamSelectField } from "../components/TeamSelect";
import { usePOSTEvents } from "../lib/apiClient";

type EventState = EventMeta & { [K: string]: unknown };

export function CreateEventModal() {
  const nav = useNavigate();
  const [type, setType] = useState(Object.keys(EVENT_TYPES)[0]);
  const EditForm = EVENT_COMPONENTS[type].EditForm;
  const doCreate = usePOSTEvents();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(
    () => EventCreateEditSchema.concat(EVENT_TYPES[type].stateSchema),
    [type]
  );

  async function submit(
    values: EventState,
    helpers: FormikHelpers<EventState>
  ) {
    console.log("submit called");
    helpers.setSubmitting(true);
    setSubmitError(null);
    try {
      console.log("POST");
      const result = await doCreate(type, values);
      nav("..");
    } catch (e) {
      helpers.setSubmitting(false);
      setSubmitError(String(e));
    }
  }

  return (
    <Modal opened onClose={() => nav("..")}>
      <Title>Create Event</Title>
      <Stack>
        <Select
          label={"Type"}
          value={type}
          onChange={(e: string) => setType(e)}
          data={Object.keys(EVENT_TYPES).map((e) => ({
            label: e.replace(/^\w/, (c) => c.toUpperCase()),
            value: e,
          }))}
          required
          data-cy="selectType"
        />
      </Stack>
      <Formik
        enableReinitialize
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialValues={schema.cast({})}
        onSubmit={submit}
        validationSchema={schema}
      >
        {({ handleSubmit, isSubmitting, errors }) => (
          <Stack>
            <DateField
              name="startTime"
              title="Date/Time"
              format="isoStr"
              independent
            />
            <TeamSelectField
              name="homeTeam"
              title="Home Team"
              helper={`If there's no notion of "home" or "away" in this game, pick arbitrarily.`}
            />
            <TeamSelectField name="awayTeam" title="Away Team" />
            <Field
              type="number"
              name="worthPoints"
              title="Points"
              helper="How many Roses points will the winner get?"
              independent
            />
            <Field
              type="number"
              name="rosesLiveID"
              title="RosesLive ID"
              helper="Don't touch this unless you know what you're doing."
              independent
            />
            <EditForm />
            <Button
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              data-cy="submit"
            >
              Create
            </Button>
            {submitError !== null && (
              <Alert>Could not create! {submitError}</Alert>
            )}
            {import.meta.env.DEV && <code>{JSON.stringify(errors)}</code>}
          </Stack>
        )}
      </Formik>
    </Modal>
  );
}
