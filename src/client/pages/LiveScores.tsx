import { useParams } from "react-router-dom";
import { EVENTS } from "../eventTypes";
import { useLiveData } from "../lib/liveData";
import invariant from "tiny-invariant";
import { Alert, Button, Modal, Form as BootstrapForm } from "react-bootstrap";
import { Formik, FormikHelpers } from "formik";
import { useState } from "react";
import { usePOSTEventAction } from "../lib/apiClient";

function EventActionModal(props: { eventType: keyof typeof EVENTS, eventId: string, actionType: any, onClose: () => void, currentState: any }) {
  const actionSchema = EVENTS[props.eventType].actions[props.actionType].schema;
  const ActionForm = EVENTS[props.eventType].actions[props.actionType].Form;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const doAction = usePOSTEventAction();

  async function submit(values: any, helpers: FormikHelpers<any>) {
    helpers.setSubmitting(true);
    setSubmitError(null);
    try {
      await doAction(props.eventType, props.eventId, props.actionType, values);
      helpers.setSubmitting(false);
      props.onClose();
    } catch (e) {
      helpers.setSubmitting(false);
      setSubmitError(String(e));
    }
  }

  return (
    <Modal show onHide={() => props.onClose()}>
      <Modal.Body>
      <Formik
          initialValues={{}}
          onSubmit={submit}
          validationSchema={actionSchema}
        >
          {({ handleReset, handleSubmit, isSubmitting }) => (
            <BootstrapForm onReset={handleReset} onSubmit={handleSubmit}>
              <ActionForm currentState={props.currentState} />
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Submit
              </Button>
              {submitError !== null && (
                <Alert variant="danger">Could not perform {props.actionType}! {submitError}</Alert>
              )}
            </BootstrapForm>
          )}
        </Formik>
      </Modal.Body>
    </Modal>
  )
}

export function LiveScores() {
  const { type, id } = useParams();
  invariant(typeof type === "string", "no type");
  invariant(typeof id === "string", "no id");
  const [data, ready, error] = useLiveData(`Event/${type}/${id}`);
  const RenderScore = EVENTS[type!].RenderScore;
  const actions = EVENTS[type].actions;

  const [activeAction, setActiveAction] = useState<keyof typeof actions | null>(null);

  if (!ready) {
    if (error != null) {
      return <Alert variant="danger">{error}</Alert>;
    }
    return (
      <div>
        <b>Connecting to server, please wait...</b>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <b>Loading data from server, please wait...</b>
      </div>
    );
  }

  return (
    <>
      {error !== null && <Alert variant="warning">{error}</Alert>}
      <RenderScore
        value={data}
        actions={Object.keys(actions).map((actionType) => (
          <Button key={actionType} onClick={() => setActiveAction(actionType)}>{actionType}</Button>
        ))}
      />
      {activeAction !== null && <EventActionModal eventType={type} eventId={id} actionType={activeAction} currentState={data} onClose={() => setActiveAction(null)} />}
    </>
  );
}
