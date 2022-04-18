import { Alert, Button, Modal, Select, Stack, Title } from "@mantine/core";
import { Form as FormikForm, Formik, FormikHelpers } from "formik";
import { ChangeEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Field } from "../../common/formFields";
import { EVENT_COMPONENTS, EVENT_TYPES } from "../../common/sports";
import { BaseEventType } from "../../common/types";
import { usePOSTEvents } from "../lib/apiClient";

export function CreateEventModal() {
  const nav = useNavigate();
  const [type, setType] = useState(Object.keys(EVENT_TYPES)[0]);
  const EditForm = EVENT_COMPONENTS[type].EditForm;
  const create = usePOSTEvents();
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(
    values: BaseEventType,
    helpers: FormikHelpers<BaseEventType>
  ) {
    console.log("submit called");
    helpers.setSubmitting(true);
    setSubmitError(null);
    try {
      console.log("POST");
      const result = await create(type, values);
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
        />
      </Stack>
      <Formik
        enableReinitialize
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialValues={{} as any}
        onSubmit={submit}
        validationSchema={EVENT_TYPES[type].schema.omit(["id", "type"])}
      >
        {({ handleSubmit, isSubmitting, errors }) => (
          <Stack>
            <Field
              type="number"
              name="worthPoints"
              title="Points"
              helper="How many Roses points will the winner get?"
            />
            <EditForm />
            <Button onClick={() => handleSubmit} disabled={isSubmitting}>
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
