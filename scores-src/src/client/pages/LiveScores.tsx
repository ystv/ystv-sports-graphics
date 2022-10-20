import { useParams } from "react-router-dom";
import { useLiveData } from "../lib/liveData";
import invariant from "tiny-invariant";
import { Form, Formik, FormikHelpers } from "formik";
import { useMemo, useState } from "react";
import {
  usePOSTEventAction,
  usePOSTEventRedo,
  usePOSTEventResync,
  usePOSTEventUndo,
  usePOSTEventDeclareWinner,
  usePOSTEventUpdateAction,
} from "../lib/apiClient";
import { capitalize, startCase } from "lodash-es";
import { EVENT_COMPONENTS, EVENT_TYPES } from "../../common/sports";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  SegmentedControl,
  Text,
  Stack,
  Title,
} from "@mantine/core";
import { findUndoneActions, wrapReducer } from "../../common/eventStateHelpers";
import { Action } from "../../common/types";
import { showNotification } from "@mantine/notifications";
import { PermGate } from "../components/PermGate";
import { IconTrophy, IconRefresh } from "@tabler/icons";
import * as Yup from "yup";
import { DateField, Checkbox } from "../../common/formFields";

function EventActionModal(props: {
  eventLeague: string;
  eventType: keyof typeof EVENT_TYPES;
  eventId: string;
  actionType: string;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentState: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialActionState: any;
  editingTs?: number;
}) {
  const actionSchema =
    EVENT_TYPES[props.eventType].actionPayloadValidators[props.actionType];
  const ActionForm =
    EVENT_COMPONENTS[props.eventType].actionForms[props.actionType] ??
    (() => <></>);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const doAction = usePOSTEventAction();
  const doUpdate = usePOSTEventUpdateAction();

  async function submit<T>(values: T, helpers: FormikHelpers<T>) {
    helpers.setSubmitting(true);
    setSubmitError(null);
    try {
      if (props.editingTs) {
        const vals = values as T & {
          newTS?: number;
          shouldChangeTime: boolean;
        };
        await doUpdate(
          props.eventLeague,
          props.eventType,
          props.eventId,
          props.editingTs,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          values as any,
          vals.shouldChangeTime ? vals.newTS : undefined
        );
      } else {
        await doAction(
          props.eventLeague,
          props.eventType,
          props.eventId,
          props.actionType,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          values as any
        );
      }
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
        initialValues={
          props.initialActionState
            ? {
                ...props.initialActionState,
                newTS: props.editingTs,
              }
            : {}
        }
        onSubmit={submit}
        validationSchema={(actionSchema as Yup.AnyObjectSchema).shape({
          newTS: Yup.number().optional(),
          shouldChangeTime: Yup.boolean().default(false),
        })}
      >
        {({ handleReset, handleSubmit, isSubmitting, isValid, values }) => (
          <>
            <Form onReset={handleReset} onSubmit={handleSubmit}>
              <Stack>
                <ActionForm
                  currentState={props.currentState}
                  meta={props.currentState}
                />
                {props.editingTs && (
                  <>
                    <Checkbox
                      title="Change Time?"
                      name="shouldChangeTime"
                      independent
                      data-cy="shouldChangeTime"
                    />
                    <DateField
                      name="newTS"
                      format="tsMs"
                      title="New Time"
                      showTime
                      showSeconds
                      disabled={!values.shouldChangeTime}
                      wrapperProps={{ "data-cy": "changeTimeField" }}
                    />
                  </>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  data-cy="performAction"
                >
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

function Timeline(props: {
  league: string;
  type: string;
  eventId: string;
  history: Action[];
  eventState: unknown;
}) {
  const [loading, setLoading] = useState<number | null>(null);
  const undo = usePOSTEventUndo();
  const redo = usePOSTEventRedo();

  async function perform(action: "undo" | "redo", ts: number) {
    setLoading(ts);
    try {
      if (action === "undo") {
        await undo(props.league, props.type, props.eventId, ts);
      } else {
        await redo(props.league, props.type, props.eventId, ts);
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

  const [editing, setEditing] = useState<number | null>(null);

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
            {/* eslint-disable @typescript-eslint/no-explicit-any */}
            <Entry
              action={action as any}
              state={state as any}
              meta={state as any}
            />
            {/* eslint-enable @typescript-eslint/no-explicit-any */}
            <PermGate require="write" fallback={<></>}>
              <>
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
                <Button
                  compact
                  variant="subtle"
                  disabled={loading !== null}
                  onClick={() => setEditing(action.meta.ts)}
                  data-cy="editButton"
                >
                  Edit
                </Button>
              </>
            </PermGate>
          </>
        </Wrapper>
      </li>
    );
  }
  result.reverse();

  // TODO make this a table rather than a UL
  return (
    <>
      <ul data-cy="timeline">{result}</ul>
      <Modal opened={editing !== null} onClose={() => setEditing(null)}>
        {editing &&
          /* the some check is needed because just before the modal closes the ts of the action may change */
          props.history.some((x) => x.meta.ts === editing) && (
            <EventActionModal
              eventLeague={props.league}
              eventType={props.type}
              eventId={props.eventId}
              editingTs={editing}
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              actionType={props.history
                .find((x) => x.meta.ts === editing)!
                .type.replace(props.type + "/", "")}
              currentState={props.eventState}
              initialActionState={
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                props.history.find((x) => x.meta.ts === editing)!.payload
              }
              onClose={() => setEditing(null)}
            />
          )}
      </Modal>
    </>
  );
}

export function LiveScores() {
  const { league, type, id } = useParams();
  invariant(typeof league === "string", "no league");
  invariant(typeof type === "string", "no type");
  invariant(typeof id === "string", "no id");
  const [state, history, status, error] = useLiveData(
    `Event/${league}/${type}/${id}`
  );
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
  const [actionInitialState, setActionInitialState] = useState<
    Record<string, unknown>
  >({});

  async function act(actionType: string, payload: Record<string, unknown>) {
    invariant(typeof league === "string", "no league");
    invariant(typeof type === "string", "no type");
    invariant(typeof id === "string", "no id");
    try {
      await doAction(league, type, id, actionType, payload);
    } catch (e) {
      showNotification({
        message: "Failed to " + actionType + ": " + String(e),
        color: "orange",
      });
    }
  }

  const [declareWinnerOpen, setDeclareWinnerOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<"home" | "away">("home");
  const [winnerSubmitting, setWinnerSubmitting] = useState(false);
  const doDeclareWinner = usePOSTEventDeclareWinner();

  async function declareWinner() {
    invariant(typeof league === "string", "no league");
    invariant(typeof type === "string", "no type");
    invariant(typeof id === "string", "no id");
    setWinnerSubmitting(true);
    try {
      await doDeclareWinner(league, type, id, selectedWinner);
      setWinnerSubmitting(false);
      setDeclareWinnerOpen(false);
    } catch (e) {
      console.warn("Failed to submit winner", e);
      let msg: string;
      if (e instanceof Error) {
        msg = e.name + " " + e.message;
      } else {
        msg = String(e);
      }
      showNotification({
        message: "Failed to declare winner: " + msg,
        color: "red",
      });
    } finally {
      setWinnerSubmitting(false);
    }
  }

  const doResync = usePOSTEventResync();

  const [resyncing, setResyncing] = useState<boolean>(false);
  async function resync() {
    invariant(typeof type === "string", "no type");
    invariant(typeof id === "string", "no id");
    setResyncing(true);
    try {
      await doResync(type, id);
      showNotification({
        message: "Resynced!",
        color: "blue",
      });
    } catch (e) {
      let msg: string;
      if (e instanceof Error) {
        msg = e.name + " " + e.message;
      } else {
        msg = String(e);
      }
      showNotification({
        message: msg,
        color: "red",
      });
    } finally {
      setResyncing(false);
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
        {state.winner && (
          <Text color="yellow">
            Winner:{" "}
            {state.winner === "home"
              ? state.homeTeam.name
              : state.awayTeam.name}
          </Text>
        )}
        <RenderScore
          meta={state}
          state={state}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          act={act as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          showActModal={(name, initialState: any) => {
            setActiveAction(name as string);
            setActionInitialState(initialState);
          }}
        />

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
            <Button
              color="yellow"
              variant="white"
              leftIcon={<IconTrophy size={16} />}
              onClick={() => setDeclareWinnerOpen(true)}
              loading={winnerSubmitting}
              disabled={winnerSubmitting}
            >
              Declare Winner
            </Button>
            <ActionIcon
              onClick={resync}
              loading={resyncing}
              disabled={resyncing}
            >
              <IconRefresh size={32} />
            </ActionIcon>
          </Group>
        </PermGate>

        <Title order={2}>Timeline</Title>
        <Timeline
          league={league}
          type={type}
          eventId={id}
          history={history}
          eventState={state}
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
            eventLeague={league}
            eventType={type}
            eventId={id}
            actionType={activeAction}
            currentState={state}
            initialActionState={actionInitialState}
            onClose={() => setActiveAction(null)}
          />
        )}
        <Modal
          opened={declareWinnerOpen}
          onClose={() => setDeclareWinnerOpen(false)}
        >
          <Stack>
            <Title order={3}>Declare Winner of {state.name}</Title>
            <SegmentedControl
              data={[
                {
                  label: state.homeTeam.name,
                  value: "home",
                },
                { label: state.awayTeam.name, value: "away" },
              ]}
              value={selectedWinner}
              onChange={(v) => setSelectedWinner(v as "home" | "away")}
              data-cy="declare-winner"
            />
            <Button
              color="yellow"
              variant="filled"
              onClick={declareWinner}
              data-cy="declare-winner-confirm"
            >
              Declare Winner
            </Button>
          </Stack>
        </Modal>
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
