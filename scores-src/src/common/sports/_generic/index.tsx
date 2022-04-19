import { Button, Group, Space, Stack, Title } from "@mantine/core";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as Yup from "yup";
import {
  clockTimeAt,
  ClockType,
  DownwardClock,
  formatMMSSMS,
  startClockAt,
  stopClockAt,
  UpwardClock,
} from "../../clock";
import { RenderClock } from "../../components/Clock";
import { wrapAction } from "../../eventStateHelpers";
import { Field } from "../../formFields";
import {
  Action,
  ActionPayloadValidators,
  ActionRenderers,
  ActionValidChecks,
  BaseEvent,
  BaseEventType,
  EventComponents,
  EventTypeInfo,
} from "../../types";

export interface State extends BaseEventType {
  scoreHome: number;
  scoreAway: number;
  clock: ClockType;
}

const schema: Yup.SchemaOf<State> = BaseEvent.shape({
  scoreHome: Yup.number().required().default(0),
  scoreAway: Yup.number().required().default(0),
  clock: UpwardClock,
});

export function createGenericSport(
  typeName: string,
  pointsButtons: number[] = [1]
) {
  const slice = createSlice({
    name: typeName,
    initialState: {
      id: "",
      name: "",
      type: typeName,
      worthPoints: 0,
      scoreHome: 0,
      scoreAway: 0,
      clock: {
        type: "upward",
        state: "stopped",
        timeLastStartedOrStopped: 0,
        wallClockLastStarted: 0,
      },
    } as State,
    reducers: {
      startClock: {
        reducer(state, action: Action) {
          startClockAt(state.clock, action.meta.ts);
        },
        prepare() {
          return wrapAction({ payload: {} });
        },
      },
      pauseClock: {
        reducer(state, action: Action) {
          stopClockAt(state.clock, action.meta.ts);
        },
        prepare() {
          return wrapAction({ payload: {} });
        },
      },
      resetClock(state) {
        state.clock.state = "stopped";
        state.clock.timeLastStartedOrStopped = 0;
      },
      addPoints: {
        reducer(
          state,
          action: Action<{ side: "home" | "away"; points: number }>
        ) {
          if (action.payload.side === "home") {
            state.scoreHome += action.payload.points;
          } else {
            state.scoreAway += action.payload.points;
          }
        },
        prepare(payload: { side: "home" | "away"; points: number }) {
          return wrapAction({ payload });
        },
      },
      setPoints: {
        reducer(
          state,
          action: Action<{ side: "home" | "away"; points: number }>
        ) {
          if (action.payload.side === "home") {
            state.scoreHome = action.payload.points;
          } else {
            state.scoreAway = action.payload.points;
          }
        },
        prepare(payload: { side: "home" | "away"; points: number }) {
          return wrapAction({ payload });
        },
      },
    },
  });

  const actionPayloadValidators: ActionPayloadValidators<
    typeof slice["actions"]
  > = {
    startClock: Yup.object({}),
    pauseClock: Yup.object({}),
    resetClock: Yup.object({}),
    addPoints: Yup.object({
      side: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).required(),
      points: Yup.number().required().min(0),
    }),
    setPoints: Yup.object({
      side: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).required(),
      points: Yup.number().required().min(0),
    }),
  };

  const actionValidChecks: ActionValidChecks<State, typeof slice["actions"]> = {
    startClock: (state) => state.clock.state === "stopped",
    pauseClock: (state) => state.clock.state === "running",
  };

  const actionRenderers: ActionRenderers<
    typeof slice["actions"],
    typeof slice["caseReducers"],
    State
  > = {
    startClock: () => <span>Clock started.</span>,
    pauseClock: ({ state }) => (
      <span>
        Clock paused at{" "}
        {formatMMSSMS(state.clock.timeLastStartedOrStopped, 0, 2)}
      </span>
    ),
    resetClock: () => <span>Clock reset.</span>,
    addPoints: ({ state, action }) => (
      <span>
        {action.payload.side}: +{action.payload.points} points at{" "}
        {formatMMSSMS(clockTimeAt(state.clock, action.meta.ts), 0, 2)}
      </span>
    ),
    setPoints: ({ state, action }) => (
      <span>
        {action.payload.side}: {action.payload.points} points at{" "}
        {formatMMSSMS(clockTimeAt(state.clock, action.meta.ts), 0, 2)}
      </span>
    ),
  };

  const typeInfo: EventTypeInfo<State, typeof slice["actions"]> = {
    reducer: slice.reducer,
    actionCreators: slice.actions,
    schema,
    actionPayloadValidators,
    actionValidChecks,
    actionRenderers,
    hiddenActions: new Set(["addPoints", "setPoints"] as const),
  };

  type lol = typeof slice["actions"];

  const components: EventComponents<typeof slice["actions"], State> = {
    EditForm: () => (
      <>
        <Field name="name" title="Name" independent />
      </>
    ),
    RenderScore: ({ state, act }) => {
      return (
        <Stack>
          <RenderClock
            key={state.clock.state + state.clock.timeLastStartedOrStopped}
            clock={state.clock}
            precisionHigh={2}
            precisionMs={0}
          />
          <Group>
            <Stack>
              <Title order={2}>{state.scoreHome}</Title>
              {pointsButtons.map((n) => (
                <Button
                  key={n}
                  onClick={() => act("addPoints", { side: "home", points: n })}
                >
                  +{n}
                </Button>
              ))}
            </Stack>
            <Stack>
              <Title order={2}>{state.scoreAway}</Title>
              {pointsButtons.map((n) => (
                <Button
                  key={n}
                  onClick={() => act("addPoints", { side: "away", points: n })}
                >
                  +{n}
                </Button>
              ))}
            </Stack>
          </Group>
          <Space h="lg" />
        </Stack>
      );
    },
    actionForms: {},
  };

  return { typeInfo, components };
}
