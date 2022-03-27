import { Form as FormikForm, Formik, FormikHelpers } from "formik";
import { useState } from "react";
import {
  Button,
  Modal,
  Form as BootstrapForm,
  FormGroup,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Field } from "../../common/formFields";
import { EVENTS } from "../eventTypes";
import { usePOSTEvents } from "../lib/apiClient";

export function CreateEventModal() {
  const nav = useNavigate();
  const [type, setType] = useState(Object.keys(EVENTS)[0]);
  const EditForm = EVENTS[type].EditForm;
  const create = usePOSTEvents();
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(values: any, helpers: FormikHelpers<any>) {
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
    <Modal show onHide={() => nav("..")}>
      <Modal.Header closeButton>Create Event</Modal.Header>
      <Modal.Body>
        <FormGroup>
          <BootstrapForm.Label>Type</BootstrapForm.Label>
          <BootstrapForm.Select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {Object.keys(EVENTS).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </BootstrapForm.Select>
        </FormGroup>
        <Formik
          enableReinitialize
          initialValues={{}}
          onSubmit={submit}
          validationSchema={EVENTS[type].schema.omit(["id", "type"])}
        >
          {({ handleReset, handleSubmit, isSubmitting, errors }) => (
            <BootstrapForm onReset={handleReset} onSubmit={handleSubmit}>
              <Field
                type="number"
                name="worthPoints"
                title="Points"
                helper="How many Roses points will the winner get?"
              />
              <EditForm />
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Create
              </Button>
              {submitError !== null && (
                <Alert variant="danger">Could not create! {submitError}</Alert>
              )}
              {import.meta.env.DEV && <code>{JSON.stringify(errors)}</code>}
            </BootstrapForm>
          )}
        </Formik>
      </Modal.Body>
    </Modal>
  );
}
