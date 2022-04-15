import { useParams } from "react-router-dom";
import { EVENTS } from "../eventTypes";
import { useLiveData } from "../lib/liveData";
import invariant from "tiny-invariant";
import { Form, Formik, FormikHelpers } from "formik";
import { useState } from "react";
import { usePOSTEventAction } from "../lib/apiClient";
import { startCase } from "lodash-es";
import { Alert, Button, Grid, Group, Modal, Stack, Title } from "@mantine/core";

function EventActionModal(props: {
  eventType: keyof typeof EVENTS;
  eventId: string;
  actionType: string;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentState: any;
}) {
  const actionSchema = EVENTS[props.eventType].actions[props.actionType].schema;
  const ActionForm = EVENTS[props.eventType].actions[props.actionType].Form;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const doAction = usePOSTEventAction();

  async function submit<T>(values: T, helpers: FormikHelpers<T>) {
    helpers.setSubmitting(true);
    setSubmitError(null);
    try {
      await doAction(
        props.eventType,
        props.eventId,
        props.actionType,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        values as any
      );
      helpers.setSubmitting(false);
      props.onClose();
    } catch (e) {
      helpers.setSubmitting(false);
      setSubmitError(String(e));
    }
  }

  return (
    <Modal opened onClose={() => props.onClose()}>
      <Title>{startCase(props.actionType)}</Title>
      <Formik
        initialValues={{}}
        onSubmit={submit}
        validationSchema={actionSchema}
      >
        {({ handleReset, handleSubmit, isSubmitting, isValid }) => (
          <>
            <Form onReset={handleReset} onSubmit={handleSubmit}>
              <Stack>
                <ActionForm currentState={props.currentState} />
                <Button type="submit" disabled={isSubmitting || !isValid}>
                  Submit
                </Button>
                {submitError !== null && (
                  <Alert>
                    Could not perform {props.actionType}! {submitError}
                  </Alert>
                )}
              </Stack>
            </Form>
          </>
        )}
      </Formik>
    </Modal>
  );
}

export function LiveScores() {
  const { type, id } = useParams();
  invariant(typeof type === "string", "no type");
  invariant(typeof id === "string", "no id");
  const [data, status, error] = useLiveData(`Event/${type}/${id}`);
  const RenderScore = EVENTS[type].RenderScore;
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
            <Group>
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
            </Group>
          }
        />
        {error !== null && <Alert>{error}</Alert>}
        {status === "POSSIBLY_DISCONNECTED" && (
          <Alert>
            Possible connection issues, reconnecting... (if this doesn&apos;t go
            away after 10 seconds please refresh the page)
            {import.meta.env.DEV && " (may be caused by HMR weirdness)"}
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
      {error && <Alert>{error}</Alert>}
      <b>{msg}</b>
    </div>
  );
}
