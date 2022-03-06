import { useParams } from "react-router-dom";
import { EVENTS } from "../eventTypes";
import { useLiveData } from "../lib/liveData";
import invariant from "tiny-invariant";
import {
  Alert,
  Button,
  Modal,
  Form as BootstrapForm,
  ButtonGroup,
} from "react-bootstrap";
import { Formik, FormikHelpers } from "formik";
import { useState } from "react";
import { usePOSTEventAction } from "../lib/apiClient";
import { startCase } from "lodash"

function EventActionModal(props: {
  eventType: keyof typeof EVENTS;
  eventId: string;
  actionType: any;
  onClose: () => void;
  currentState: any;
}) {
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
      <Modal.Header>
        {startCase(props.actionType)}
      </Modal.Header>
      <Modal.Body>
        <Formik
          initialValues={{}}
          onSubmit={submit}
          validationSchema={actionSchema}
        >
          {({ handleReset, handleSubmit, isSubmitting, isValid }) => (
            <BootstrapForm onReset={handleReset} onSubmit={handleSubmit}>
              <ActionForm currentState={props.currentState} />
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !isValid}
              >
                Submit
              </Button>
              {submitError !== null && (
                <Alert variant="danger">
                  Could not perform {props.actionType}! {submitError}
                </Alert>
              )}
            </BootstrapForm>
          )}
        </Formik>
      </Modal.Body>
    </Modal>
  );
}

export function LiveScores() {
  const { type, id } = useParams();
  invariant(typeof type === "string", "no type");
  invariant(typeof id === "string", "no id");
  const [data, status, error] = useLiveData(`Event/${type}/${id}`);
  const RenderScore = EVENTS[type!].RenderScore;
  const actions = EVENTS[type].actions;

  const [activeAction, setActiveAction] = useState<keyof typeof actions | null>(
    null
  );

  if (status === "READY" || status === "POSSIBLY_DISCONNECTED") {
    if (!data) {
      return (
        <div>
          <b>Loading data from server, please wait...</b>
        </div>
      );
    }

    return (
      <>
        <RenderScore
          value={data}
          actions={
            <ButtonGroup>
              {Object.keys(actions)
                .filter((type) => {
                  const validFn = actions[type].valid;
                  if (!validFn) {
                    return true;
                  }
                  return validFn(data);
                })
                .map((actionType) => (
                  <Button
                    key={actionType}
                    onClick={() => setActiveAction(actionType)}
                  >
                    {startCase(actionType)}
                  </Button>
                ))}
            </ButtonGroup>
          }
        />
        {error !== null && <Alert variant="warning">{error}</Alert>}
        {status === "POSSIBLY_DISCONNECTED" && (
          <Alert variant="warning">
            Possible connection issues, reconnecting...
          </Alert>
        )}
        {activeAction !== null && (
          <EventActionModal
            eventType={type}
            eventId={id}
            actionType={activeAction}
            currentState={data}
            onClose={() => setActiveAction(null)}
          />
        )}
      </>
    );
  }

  let msg = "";
  switch (status) {
    case "NOT_CONNECTED":
      msg = "Connecting to server...";
      break;
    case "CONNECTED":
      msg = "Synchronising...";
      break;
  }
  return (
    <div>
      {error && <Alert variant="warning">{error}</Alert>}
      <b>{msg}</b>
    </div>
  );
}
