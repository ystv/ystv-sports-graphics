import { Button, Group, Space, Stack, Text } from "@mantine/core";
import { createSlice } from "@reduxjs/toolkit";
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
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons";

export interface State extends BaseEventType {
  scoreHome: number;
  scoreAway: number;
  /** The index of the current half/quarter/sub-division of this event, one-based! */
  segment: number;
  clock: ClockType;
}

/**
 * createGenericSport defines everything needed to implement the backend of a "simple" sport, where
 * each team has a simple numeric score that can go up by an integer, plus a clock that can go
 * either up or down.
 * @param typeName the name to give to this sport - must match that used in the graphics
 * @param pointsButtons buttons to show to add points (+N) - default is +1
 * @param downwardClockStartingTimeMs if set, clock will go downwards. if a number, will always start at that time. if an array, will start at the Nth
 * @param segmentName a function to get what to call the current half/quarter - should return e.g. "half", "quarter", or "extra time period".
 * @param quickClock if true, the pause/resume actions will not require confirmation
 * @returns
 */
export function createGenericSport(
  typeName: string,
  pointsButtons: number[] = [1],
  downwardClockStartingTimeMs?: number | number[],
  segmentName?: (idx: number) => string,
  quickClock = false
) {
  const isDownward = typeof downwardClockStartingTimeMs !== "undefined";
  const schema: Yup.SchemaOf<State> = BaseEvent.shape({
    scoreHome: Yup.number().required().default(0),
    scoreAway: Yup.number().required().default(0),
    segment: Yup.number().required().default(0),
    clock: isDownward ? DownwardClock : UpwardClock,
  });

  const clockStartsFrom = (segmentIdx: number) => {
    if (!isDownward) {
      return undefined;
    }
    if (typeof downwardClockStartingTimeMs === "number") {
      return downwardClockStartingTimeMs;
    }
    if (segmentIdx <= downwardClockStartingTimeMs.length) {
      return downwardClockStartingTimeMs[segmentIdx - 1];
    }
    return downwardClockStartingTimeMs[downwardClockStartingTimeMs.length - 1];
  };

  const segmentNameFn = segmentName ?? (() => "half/quarter");

  const slice = createSlice({
    name: typeName,
    initialState: {
      id: "",
      name: "",
      type: typeName,
      startTime: "2022-04-29T09:00:00+01:00",
      worthPoints: 0,
      scoreHome: 0,
      scoreAway: 0,
      clock: {
        type: isDownward ? "downward" : "upward",
        state: "stopped",
        timeLastStartedOrStopped: 0,
        wallClockLastStarted: 0,
      },
      segment: 0,
    } as State,
    reducers: {
      startClock: {
        reducer(state, action: Action) {
          state.segment++;
          startClockAt(
            state.clock,
            action.meta.ts,
            clockStartsFrom(state.segment)
          );
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
      resumeClock: {
        reducer(state, action: Action) {
          startClockAt(
            state.clock,
            action.meta.ts,
            clockStartsFrom(state.segment)
          );
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
    resumeClock: Yup.object({}),
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
    startClock: (state) =>
      state.clock.state === "stopped" ||
      // safe to use `new Date()` here, because this isn't called from a reducer
      (isDownward && clockTimeAt(state.clock, new Date().valueOf()) === 0),
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
        {formatMMSSMS(
          isDownward
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              clockStartsFrom(state.segment)! -
                state.clock.timeLastStartedOrStopped
            : state.clock.timeLastStartedOrStopped,
          0,
          2
        )}
      </span>
    ),
    resumeClock: () => <span>Clock resumed.</span>,
    resetClock: () => <span>Clock reset.</span>,
    addPoints: ({ state, action }) => (
      <span>
        {action.payload.side}: +{action.payload.points} points at{" "}
        {formatMMSSMS(
          isDownward
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              clockStartsFrom(state.segment)! -
                clockTimeAt(state.clock, action.meta.ts)
            : clockTimeAt(state.clock, action.meta.ts),
          0,
          2
        )}
      </span>
    ),
    setPoints: ({ state, action }) => (
      <span>
        {action.payload.side}: {action.payload.points} points at{" "}
        {formatMMSSMS(
          isDownward
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              clockStartsFrom(state.segment)! -
                clockTimeAt(state.clock, action.meta.ts)
            : clockTimeAt(state.clock, action.meta.ts),
          0,
          2
        )}
      </span>
    ),
  };

  const hiddenActions = new Set(["addPoints", "setPoints"] as Array<
    keyof typeof slice["actions"]
  >);

  if (quickClock) {
    hiddenActions.add("pauseClock");
    hiddenActions.add("resumeClock");
  }

  const typeInfo: EventTypeInfo<State, typeof slice["actions"]> = {
    reducer: slice.reducer,
    actionCreators: slice.actions,
    schema,
    actionPayloadValidators,
    actionValidChecks,
    actionRenderers,
    hiddenActions,
  };

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
              <Text size="sm" weight="bold" transform="uppercase">
                Home
              </Text>
              <Text size="xl">{state.scoreHome}</Text>
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
              <Text size="sm" weight="bold" transform="uppercase">
                Away
              </Text>
              <Text size="xl">{state.scoreAway}</Text>
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
          <Space h="md" />
          <Group>
            {state.segment > 0 &&
              quickClock &&
              (state.clock.state === "running" ? (
                <Button
                  leftIcon={<IconPlayerPause />}
                  onClick={() => act("pauseClock", undefined)}
                >
                  Pause Clock
                </Button>
              ) : (
                <Button
                  leftIcon={<IconPlayerPlay />}
                  onClick={() => act("resumeClock", undefined)}
                >
                  Unpause Clock
                </Button>
              ))}
          </Group>
          <Space h="lg" />
        </Stack>
      );
    },
    actionForms: {
      startClock: ({ currentState }) => {
        if (currentState.segment > 0) {
          return (
            <p>
              This will start a new {segmentNameFn(currentState.segment)}. If
              you want to resume the current one, use <code>Resume Clock</code>.
            </p>
          );
        }
        return <></>;
      },
      resumeClock: ({ currentState }) => {
        if (currentState.segment > 0) {
          return (
            <p>
              This will resume the current {segmentNameFn(currentState.segment)}
              . If you want to start a new one, use <code>Start Clock</code>.
            </p>
          );
        }
        return <></>;
      },
    },
  };

  return { typeInfo, components };
}
