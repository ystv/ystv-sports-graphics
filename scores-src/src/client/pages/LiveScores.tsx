import { useParams } from "react-router-dom";
import { useLiveData } from "../lib/liveData";
import invariant from "tiny-invariant";
import { Form, Formik, FormikHelpers } from "formik";
import { useMemo, useState } from "react";
import {
  usePOSTEventAction,
  usePOSTEventRedo,
  usePOSTEventUndo,
} from "../lib/apiClient";
import { startCase } from "lodash-es";
import { EVENT_COMPONENTS, EVENT_TYPES } from "../../common/sports";
import { Alert, Button, Grid, Group, Modal, Stack, Title } from "@mantine/core";
import { findUndoneActions, wrapReducer } from "../../common/eventStateHelpers";
import { Action } from "../../common/types";
import { showNotification } from "@mantine/notifications";
import { PermGate } from "../components/PermGate";

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
    (() => <></>);
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

function Timeline(props: { type: string; eventId: string; history: Action[] }) {
  const [loading, setLoading] = useState<number | null>(null);
  const undo = usePOSTEventUndo();
  const redo = usePOSTEventRedo();

  async function perform(action: "undo" | "redo", ts: number) {
    setLoading(ts);
    try {
      if (action === "undo") {
        await undo(props.type, props.eventId, ts);
      } else {
        await redo(props.type, props.eventId, ts);
      }
    } catch (e) {
      showNotification({
        message: "Failed to " + action + ": " + String(e),
        color: "orange",
      });
    } finally {
      setLoading(null);
    }
  }

  const result: JSX.Element[] = [];
  let state = {};
  const reducer = wrapReducer(EVENT_TYPES[props.type].reducer);
  const actionRenderers = EVENT_TYPES[props.type].actionRenderers;
  const allUndoneActions = useMemo(
    () => findUndoneActions(props.history),
    [props.history]
  );

  for (const action of props.history) {
    const undone = allUndoneActions.has(action.meta.ts);
    if (!undone) {
      state = reducer(state, action);
    }
    if (action.type[0] === "@") {
      continue;
    }
    const Entry = actionRenderers[action.type.replace(/^.*?\//, "") as string];
    const Wrapper = ({ children }: { children: JSX.Element }) =>
      undone ? <s>{children}</s> : children;
    result.push(
      <li key={action.type + action.meta.ts}>
        <Wrapper>
          <>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Entry action={action as any} state={state as any} />
            <PermGate require="write" fallback={<></>}>
              <Button
                compact
                variant={undone ? "default" : "subtle"}
                loading={loading === action.meta.ts}
                disabled={loading !== null}
                onClick={() =>
                  perform(undone ? "redo" : "undo", action.meta.ts)
                }
              >
                {undone ? "Redo" : "Undo"}
              </Button>
            </PermGate>
          </>
        </Wrapper>
      </li>
    );
  }
  result.reverse();

  // TODO make this a table rather than a UL
  return <ul>{result}</ul>;
}

export function LiveScores() {
  const { type, id } = useParams();
  invariant(typeof type === "string", "no type");
  invariant(typeof id === "string", "no id");
  const [state, history, status, error] = useLiveData(`Event/${type}/${id}`);
  const RenderScore = EVENT_COMPONENTS[type].RenderScore;
  const actionValidChecks = EVENT_TYPES[type].actionValidChecks;
  const actionPayloadValidators = EVENT_TYPES[type].actionPayloadValidators;
  const hiddenActions = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => EVENT_TYPES[type].hiddenActions ?? new Set<any>(),
    [type]
  );
  const doAction = usePOSTEventAction();

  const [activeAction, setActiveAction] = useState<string | null>(null);

  async function act(actionType: string, payload: Record<string, unknown>) {
    invariant(typeof type === "string", "no type");
    invariant(typeof id === "string", "no id");
    try {
      await doAction(type, id, actionType, payload);
    } catch (e) {
      showNotification({
        message: "Failed to " + actionType + ": " + String(e),
        color: "orange",
      });
    }
  }

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
        <Title order={1}>{state.name}</Title>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <RenderScore state={state} act={act as any} />

        <PermGate require="write" fallback={<></>}>
          <Group>
            {Object.keys(actionPayloadValidators)
              .filter((x) => !hiddenActions.has(x))
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
        </PermGate>

        <Title order={2}>Timeline</Title>
        <Timeline type={type} eventId={id} history={history} />
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
