import { Form as FormikForm, Formik, FormikHelpers } from "formik";
import { useState } from "react";
import { Button, Modal, Form as BootstrapForm, Alert } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { Field } from "../../common/formFields";
import { EVENTS } from "../eventTypes";
import { useGETEvent, usePUTEvent } from "../lib/apiClient";

export function EditEventForm() {
  const { type, id } = useParams();
  const EditForm = EVENTS[type!].EditForm;
  const { loading, error, data } = useGETEvent(type!, id!);
  const update = usePUTEvent();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nav = useNavigate();

  async function submit(values: any, helpers: FormikHelpers<any>) {
    helpers.setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await update(type!, id!, values);
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
          initialValues={data}
          validationSchema={EVENTS[type!].schema}
          onSubmit={submit}
        >
          {({ handleSubmit, handleReset, isSubmitting, errors }) => (
            <BootstrapForm onSubmit={handleSubmit} onReset={handleReset}>
              <Field
                type="number"
                name="worthPoints"
                title="Points"
                helper="How many Roses points will the winner get?"
              />
              <EditForm />
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                Save
              </Button>
              {submitError !== null && (
                <Alert variant="danger">Could not save! {submitError}</Alert>
              )}
              {import.meta.env.DEV && <code>{JSON.stringify(errors)}</code>}
            </BootstrapForm>
          )}
        </Formik>
      )}
    </>
  );
}

export function EditEventModal() {
  const nav = useNavigate();
  const { type, id } = useParams();
  const { loading, error, data } = useGETEvent(type!, id!);
  return (
    <Modal show onHide={() => nav("/events")}>
      <Modal.Header closeButton>Editing {data?.name || id}</Modal.Header>
      <Modal.Body>
        <EditEventForm />
      </Modal.Body>
    </Modal>
  );
}
