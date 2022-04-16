import { useParams } from "react-router-dom";
import { useLiveData } from "../lib/liveData";
import invariant from "tiny-invariant";
import { Form, Formik, FormikHelpers } from "formik";
import { useState } from "react";
import { usePOSTEventAction } from "../lib/apiClient";
import { startCase } from "lodash-es";
import { EVENT_COMPONENTS, EVENT_TYPES } from "../../common/sports";
import { Alert, Button, Grid, Group, Modal, Stack, Title } from "@mantine/core";
import { actionPayloadValidators } from "../../common/sports/netball";

function EventActionModal(props: {
  eventType: keyof typeof EVENT_TYPES;
  eventId: string;
  actionType: string;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentState: any;
}) {
  console.log("goalform currentState", props.currentState);
  const actionSchema =
    EVENT_TYPES[props.eventType].actionPayloadValidators[props.actionType];
  const ActionForm =
    EVENT_COMPONENTS[props.eventType].actionForms[props.actionType] ??
    (() => null);
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
  const [state, history, status, error] = useLiveData(`Event/${type}/${id}`);
  const RenderScore = EVENT_COMPONENTS[type].RenderScore;
  const actionValidChecks = EVENT_TYPES[type].actionValidChecks;

  const [activeAction, setActiveAction] = useState<string | null>(null);

  if (status === "READY" || status === "POSSIBLY_DISCONNECTED") {
    console.log("State:", state);
    if (!state) {
      return (
        <div>
          <b>Loading data from server, please wait...</b>
        </div>
      );
    }

    return (
      <>
        <RenderScore
          state={state}
          actions={
            <Group>
              {Object.keys(actionPayloadValidators)
                .filter((type) => {
                  const validFn = actionValidChecks[type];
                  if (!validFn) {
                    return true;
                  }
                  return validFn(state);
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
            currentState={state}
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
