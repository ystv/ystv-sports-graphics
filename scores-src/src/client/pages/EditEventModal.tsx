import { Alert, Button, Modal, Stack, Title } from "@mantine/core";
import { Form as FormikForm, Formik, FormikHelpers } from "formik";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import invariant from "tiny-invariant";
import { DateField, Field } from "../../common/formFields";
import { EVENT_COMPONENTS, EVENT_TYPES } from "../../common/sports";
import { EventCreateEditSchema } from "../../common/types";
import { useGETEvent, usePUTEvent } from "../lib/apiClient";

export function EditEventForm() {
  const { type, id } = useParams();
  invariant(typeof type === "string", "no type given");
  invariant(typeof id === "string", "no id given");
  const EditForm = EVENT_COMPONENTS[type].EditForm;
  const { loading, error, data } = useGETEvent(type, id);
  const update = usePUTEvent();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nav = useNavigate();

  const schema = EventCreateEditSchema.concat(EVENT_TYPES[type].stateSchema);

  async function submit<T>(values: T, helpers: FormikHelpers<T>) {
    invariant(typeof type === "string", "no type given");
    invariant(typeof id === "string", "no id given");
    helpers.setSubmitting(true);
    setSubmitError(null);
    try {
      //@ts-expect-error no good way to type this
      const result = await update(type, id, values);
      nav("/events");
    } catch (e) {
      helpers.setSubmitting(false);
      setSubmitError(String(e));
    }
  }

  return (
    <>
      {loading && <b>Loading details... hang on just a sec!</b>}
      {error && (
        <b>
          Something went wrong! <code>{error}</code>
        </b>
      )}
      {data && (
        <Formik
          // This cast takes care of transforming the home/away team into the slugs, rather than the raw objects.
          initialValues={schema.cast(data)}
          validationSchema={schema}
          onSubmit={submit}
        >
          {({ handleSubmit, handleReset, isSubmitting, errors }) => (
            <FormikForm onSubmit={handleSubmit} onReset={handleReset}>
              <Stack>
                <DateField
                  name="startTime"
                  title="Date/Time"
                  format="isoStr"
                  independent
                />
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
                <Button type="submit" disabled={isSubmitting} data-cy="submit">
                  Save
                </Button>
                {submitError !== null && (
                  <Alert>Could not save! {submitError}</Alert>
                )}
                {import.meta.env.DEV && (
                  <code data-cy="errors">{JSON.stringify(errors)}</code>
                )}
              </Stack>
            </FormikForm>
          )}
        </Formik>
      )}
    </>
  );
}

export function EditEventModal() {
  const nav = useNavigate();
  const { type, id } = useParams();
  invariant(typeof type === "string", "no type given");
  invariant(typeof id === "string", "no id given");
  const { loading, error, data } = useGETEvent(type, id);
  return (
    <Modal opened onClose={() => nav("/events")}>
      <Title>Editing {data?.name || id}</Title>
      <EditEventForm />
    </Modal>
  );
}
