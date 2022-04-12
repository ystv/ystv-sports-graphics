import { Alert, Button, Modal, Select, Stack, Title } from "@mantine/core";
import { Form as FormikForm, Formik, FormikHelpers } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Field } from "../../common/formFields";
import { BaseEventType } from "../../common/types";
import { EVENTS } from "../eventTypes";
import { usePOSTEvents } from "../lib/apiClient";

export function CreateEventModal() {
  const nav = useNavigate();
  const [type, setType] = useState(Object.keys(EVENTS)[0]);
  const EditForm = EVENTS[type].EditForm;
  const create = usePOSTEvents();
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(
    values: BaseEventType,
    helpers: FormikHelpers<BaseEventType>
  ) {
    helpers.setSubmitting(true);
    setSubmitError(null);
    try {
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
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          onChange={(e) => setType(e!)}
          data={Object.keys(EVENTS).map((e) => ({
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
        validationSchema={EVENTS[type].schema.omit(["id", "type"])}
      >
        {({ handleReset, handleSubmit, isSubmitting, errors }) => (
          <Stack>
            <Field
              type="number"
              name="worthPoints"
              title="Points"
              helper="How many Roses points will the winner get?"
            />
            <EditForm />
            <Button type="submit" disabled={isSubmitting}>
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
