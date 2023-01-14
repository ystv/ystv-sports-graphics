import { Button, Group, Space, Stack, Text, Title } from "@mantine/core";
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
import {
  ArrayField,
  Checkbox,
  Field,
  RandomUUIDField,
  SelectField,
} from "../../formFields";
import {
  Action,
  ActionPayloadValidators,
  ActionRenderers,
  ActionValidChecks,
  BaseEventStateType,
  EventComponents,
  EventTypeInfo,
} from "../../types";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons";
import { capitalize } from "lodash-es";
import { useFormikContext } from "formik";

export interface State extends BaseEventStateType {
  scoreHome: number;
  scoreAway: number;
  /** The index of the current half/quarter/sub-division of this event, one-based! */
  segment: number;
  segmentPoints: Point[][];
  clock: ClockType;
  players?: {
    home: PlayerType[];
    away: PlayerType[];
  };
}

export interface PlayerType {
  id: string;
  name: string;
  designation: string;
  startsOnBench: boolean;
}

const PlayerSchema: Yup.SchemaOf<PlayerType> = Yup.object({
  id: Yup.string().uuid().required(),
  name: Yup.string().required(),
  designation: Yup.string().required(),
  startsOnBench: Yup.boolean().required().default(false),
});

interface Point {
  side: "home" | "away";
  player?: string | null;
}

const PointSchema: Yup.SchemaOf<Point> = Yup.object({
  side: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).required(),
  player: Yup.string().uuid().optional().nullable(),
});

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
  quickClock = false,
  enableLineup = false
) {
  const isDownward = typeof downwardClockStartingTimeMs !== "undefined";
  const playersSchema = Yup.object({
    home: Yup.array().of(PlayerSchema.required()).required().default([]),
    away: Yup.array().of(PlayerSchema.required()).required().default([]),
  });
  const schema: Yup.SchemaOf<State> = Yup.object().shape({
    scoreHome: Yup.number().required().default(0),
    scoreAway: Yup.number().required().default(0),
    segment: Yup.number().required().default(0),
    clock: isDownward ? DownwardClock : UpwardClock,
    players: enableLineup ? playersSchema.required() : playersSchema.optional(),
    segmentPoints: Yup.array()
      .of(Yup.array().of(PointSchema))
      .required()
      .default([]),
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
      players: {
        home: [],
        away: [],
      },
      segmentPoints: [],
    } as State,
    reducers: {
      startClock: {
        reducer(state, action: Action) {
          state.segment++;
          state.segmentPoints.push([]);
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
          startClockAt(state.clock, action.meta.ts);
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
          action: Action<{
            side: "home" | "away";
            points: number;
            player?: string | null;
          }>
        ) {
          if (action.payload.side === "home") {
            state.scoreHome += action.payload.points;
          } else {
            state.scoreAway += action.payload.points;
          }
          if (typeof action.payload.player !== "undefined") {
            state.segmentPoints[state.segmentPoints.length - 1].push({
              side: action.payload.side,
              player: action.payload.player,
            });
          }
        },
        prepare(payload: {
          side: "home" | "away";
          points: number;
          player?: string | null;
        }) {
          return wrapAction({ payload });
        },
      },
      resetState: {
        reducer(state) {
          state.segmentPoints = [];
          state.segment = 0;
          state.scoreHome = 0;
          state.scoreAway = 0;
          state.clock = {
            type: isDownward ? "downward" : "upward",
            state: "stopped",
            timeLastStartedOrStopped: 0,
            wallClockLastStarted: 0,
          };
        },
        prepare() {
          return wrapAction({ payload: {} });
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
      player: Yup.string().uuid().optional().nullable(),
    }),
    resetState: Yup.object({}),
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
    addPoints: ({ state, meta, action }) => {
      let tag: string;
      const teamName =
        action.payload.side === "home"
          ? meta.homeTeam.name
          : meta.awayTeam.name;
      if (action.payload.player && state.players) {
        const playerData = state.players[action.payload.side].find(
          (x) => x.id === action.payload.player
        );
        if (playerData) {
          tag = `${playerData.name} (${playerData.designation}, ${teamName})`;
        } else {
          tag = teamName;
        }
      } else {
        tag = teamName;
      }
      return (
        <span>
          {tag}: +{action.payload.points} points at{" "}
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
      );
    },
    resetState: () => <strong>State reset.</strong>,
  };

  const hiddenActions = new Set(["addPoints"] as Array<
    keyof typeof slice["actions"]
  >);

  if (quickClock) {
    hiddenActions.add("pauseClock");
    hiddenActions.add("resumeClock");
  }

  const typeInfo: EventTypeInfo<State, typeof slice["actions"]> = {
    reducer: slice.reducer,
    actionCreators: slice.actions,
    stateSchema: schema,
    actionPayloadValidators,
    actionValidChecks,
    actionRenderers,
    hiddenActions,
    dangerousActions: new Set(["resetState"] as const),
  };

  const components: EventComponents<typeof slice["actions"], State> = {
    EditForm: ({ meta }) => (
      <>
        <Field name="name" title="Name" independent />
        {enableLineup && (
          <>
            <fieldset>
              <Title order={3}>{meta.homeTeam?.name ?? "Home Side"}</Title>
              <ArrayField
                name="players.home"
                title="Players"
                initialChildValue={{ name: "", number: "" }}
                renderChild={({ namespace }) => (
                  <div>
                    <RandomUUIDField name={namespace + "id"} />
                    <Field name={namespace + "name"} title="Name" independent />
                    <Field
                      name={namespace + "designation"}
                      title="Designation (number)"
                      independent
                    />
                    <Checkbox
                      name={namespace + "startsOnBench"}
                      title="Starts on bench?"
                      independent
                    />
                  </div>
                )}
              />
            </fieldset>
            <fieldset>
              <Title order={3}>{meta.awayTeam?.name ?? "Away Side"}</Title>
              <ArrayField
                name="players.away"
                title="Players"
                initialChildValue={{ name: "", number: "" }}
                renderChild={({ namespace }) => (
                  <div>
                    <RandomUUIDField name={namespace + "id"} />
                    <Field name={namespace + "name"} title="Name" independent />
                    <Field
                      name={namespace + "designation"}
                      title="Designation (number)"
                      independent
                    />
                    <Checkbox
                      name={namespace + "startsOnBench"}
                      title="Starts on bench?"
                      independent
                    />
                  </div>
                )}
              />
            </fieldset>
          </>
        )}
      </>
    ),
    RenderScore: ({ state, meta, act, showActModal }) => {
      return (
        <Stack>
          {typeof segmentName === "function" && (
            <Text color="dimmed">
              {capitalize(segmentName(state.segment))} {state.segment}
            </Text>
          )}
          <RenderClock
            key={state.clock.state + state.clock.timeLastStartedOrStopped}
            clock={state.clock}
            precisionHigh={2}
            precisionMs={0}
          />
          <Group>
            <Stack>
              <Text size="sm" weight="bold" transform="uppercase">
                {meta.homeTeam.name}
              </Text>
              <Text size="xl">{state.scoreHome}</Text>
              {pointsButtons.map((n) => (
                <Button
                  key={n}
                  disabled={state.segmentPoints.length === 0}
                  onClick={() =>
                    enableLineup
                      ? showActModal("addPoints", {
                          side: "home",
                          points: n,
                          player: null,
                        })
                      : act("addPoints", { side: "home", points: n })
                  }
                  size="lg"
                >
                  +{n}
                </Button>
              ))}
            </Stack>
            <Stack>
              <Text size="sm" weight="bold" transform="uppercase">
                {meta.awayTeam.name}
              </Text>
              <Text size="xl">{state.scoreAway}</Text>
              {pointsButtons.map((n) => (
                <Button
                  key={n}
                  disabled={state.segmentPoints.length === 0}
                  onClick={() =>
                    enableLineup
                      ? showActModal("addPoints", {
                          side: "away",
                          points: n,
                          player: null,
                        })
                      : act("addPoints", { side: "away", points: n })
                  }
                  size="lg"
                >
                  +{n}
                </Button>
              ))}
            </Stack>
          </Group>
          <Group>
            {state.segment > 0 && quickClock && (
              <>
                <Space h="md" />
                {state.clock.state === "running" ? (
                  <Button
                    leftIcon={<IconPlayerPause />}
                    onClick={() => act("pauseClock", undefined)}
                    size="md"
                  >
                    Pause Clock
                  </Button>
                ) : (
                  <Button
                    leftIcon={<IconPlayerPlay />}
                    onClick={() => act("resumeClock", undefined)}
                    size="md"
                  >
                    Unpause Clock
                  </Button>
                )}
              </>
            )}
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
      addPoints: ({ currentState }) => {
        const form =
          useFormikContext<
            Yup.InferType<typeof actionPayloadValidators["addPoints"]>
          >();
        const players: { home: PlayerType[]; away: PlayerType[] } =
          currentState.players ?? {
            home: [] as PlayerType[],
            away: [] as PlayerType[],
          };
        return (
          <SelectField
            name="player"
            title="Player"
            // @ts-expect-error typing here is funky
            values={[[null, "Unknown"]].concat(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              players[form.values.side]?.map((player) => [
                player.id,
                `${player.name} (${player.designation})`,
              ])
            )}
          />
        );
      },
    },
  };

  return { typeInfo, components };
}
