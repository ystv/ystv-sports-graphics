import * as Yup from "yup";
import {
  ActionFormProps,
  ActionRenderers,
  BaseEventStateType,
  EventComponents,
  EventMeta,
  EventTypeInfo,
} from "../../types";
import {
  ArrayField,
  Field,
  RandomUUIDField,
  SegmentedSelectField,
  SelectField,
} from "../../formFields";
import { useFormikContext } from "formik";
import { RenderClock } from "../../components/Clock";
import { Mark, Stack, Title, Text, Table, Button } from "@mantine/core";
import { IconPencil } from "@tabler/icons";
import { ReactNode } from "react";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  clockTimeAt,
  formatMMSSMS,
  startClockAt,
  stopClockAt,
  UpwardClock,
  UpwardClockType,
} from "../../clock";
import {
  Action,
  ActionPayloadValidators,
  ActionValidChecks,
} from "../../types";
import { wrapAction } from "../../eventStateHelpers";

const playerSchema = Yup.object({
  id: Yup.string().uuid().required(),
  name: Yup.string().required(),
  number: Yup.string()
    .required()
    .matches(/^[0-9]*$/, "must be a number"),
});

type PlayerType = Yup.InferType<typeof playerSchema>;

export interface State extends BaseEventStateType {
  players: {
    home: PlayerType[];
    away: PlayerType[];
  };
  halves: Array<{
    stoppageTime: number;
    goals: Array<{
      side: "home" | "away";
      player: string | null;
      time: number;
    }>;
  }>;
  clock: UpwardClockType;
  scoreHome: number;
  scoreAway: number;
  ruleset: keyof typeof RULESETS;
}

interface Ruleset {
  halfDurationMs: number;
  extraTimeDurationMs: number;
}

const RULESETS = {
  _default: {
    halfDurationMs: 45 * 60 * 1000,
    extraTimeDurationMs: 15 * 60 * 1000,
  },
  sixtyMinutes: {
    halfDurationMs: 30 * 60 * 1000,
    extraTimeDurationMs: 15 * 60 * 1000,
  },
};

const MAX_HALVES_WITHOUT_EXTRA_TIME = 2;
const slice = createSlice({
  name: "football",
  initialState: {
    id: "",
    type: "football",
    name: "",
    startTime: "2022-04-29T09:00:00+01:00",
    worthPoints: 0,
    players: {
      home: [],
      away: [],
    },
    halves: [],
    clock: {
      type: "upward",
      state: "stopped",
      timeLastStartedOrStopped: 0,
      wallClockLastStarted: 0,
    },
    scoreHome: 0,
    scoreAway: 0,
    ruleset: "_default",
  } as State,
  reducers: {
    goal: {
      reducer(
        state,
        action: Action<{ side: "home" | "away"; player: string | null }>
      ) {
        if (action.payload.side === "home") {
          state.scoreHome++;
        } else {
          state.scoreAway++;
        }
        state.halves[state.halves.length - 1].goals.push({
          side: action.payload.side,
          player: action.payload.player,
          time: clockTimeAt(state.clock, action.meta.ts),
        });
      },
      prepare(payload: { side: "home" | "away"; player: string | null }) {
        return wrapAction({ payload });
      },
    },
    startHalf: {
      reducer(state, action: Action) {
        const halfDuration =
          RULESETS[state.ruleset ?? "_default"].halfDurationMs;
        const extraTimeDuration =
          RULESETS[state.ruleset ?? "_default"].extraTimeDurationMs;
        state.halves.push({
          goals: [],
          stoppageTime: 0,
        });
        if (state.halves.length <= MAX_HALVES_WITHOUT_EXTRA_TIME) {
          state.clock.timeLastStartedOrStopped =
            halfDuration * (state.halves.length - 1);
        } else {
          state.clock.timeLastStartedOrStopped =
            halfDuration * MAX_HALVES_WITHOUT_EXTRA_TIME +
            extraTimeDuration *
              (state.halves.length - MAX_HALVES_WITHOUT_EXTRA_TIME - 1);
        }
        startClockAt(state.clock, action.meta.ts);
      },
      prepare() {
        return wrapAction({ payload: {} });
      },
    },
    resumeCurrentHalf: {
      reducer(state, action: Action) {
        startClockAt(state.clock, action.meta.ts);
      },
      prepare() {
        return wrapAction({ payload: {} });
      },
    },
    endHalf: {
      reducer(state, action: Action) {
        stopClockAt(state.clock, action.meta.ts);
      },
      prepare() {
        return wrapAction({ payload: {} });
      },
    },
    addStoppageTime(state, action: PayloadAction<{ minutes: number }>) {
      state.halves[state.halves.length - 1].stoppageTime =
        action.payload.minutes;
    },
  },
});

export const reducer = slice.reducer;
export const actions = slice.actions;

export const schema: Yup.SchemaOf<State> = Yup.object().shape({
  scoreHome: Yup.number().default(0),
  scoreAway: Yup.number().default(0),
  clock: UpwardClock,
  halves: Yup.array()
    .of(
      Yup.object({
        stoppageTime: Yup.number().default(0),
        goals: Yup.array().of(
          Yup.object({
            side: Yup.mixed<"home" | "away">()
              .oneOf(["home", "away"])
              .required(),
            player: Yup.string().nullable(),
            time: Yup.number().required(),
          })
        ),
      })
    )
    .default([]),
  players: Yup.object({
    home: Yup.array().of(playerSchema).required().default([]),
    away: Yup.array().of(playerSchema).required().default([]),
  }),
  ruleset: Yup.mixed<keyof typeof RULESETS>()
    .oneOf(["_default", "sixtyMinutes"])
    .required()
    .default("_default"),
});

export const actionPayloadValidators: ActionPayloadValidators<
  typeof slice["actions"]
> = {
  goal: Yup.object({
    side: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).required(),
    player: Yup.string().uuid().nullable().default(null),
  }),
  startHalf: Yup.object({}),
  // pauseClock: Yup.object({}),
  resumeCurrentHalf: Yup.object({}),
  endHalf: Yup.object({}),
  addStoppageTime: Yup.object({
    minutes: Yup.number().required().min(0),
  }),
};

export const actionValidChecks: ActionValidChecks<
  State,
  typeof slice["actions"]
> = {
  goal: (state) => state.halves.length > 0,
  startHalf: (state) => state.clock.state === "stopped",
  resumeCurrentHalf: (state) =>
    state.halves.length > 0 && state.clock.state === "stopped",
  addStoppageTime: (state) => state.halves.length > 0,
  endHalf: (state) =>
    state.halves.length > 0 && state.clock.state === "running",
};

export const actionRenderers: ActionRenderers<
  typeof actions,
  typeof slice["caseReducers"],
  State
> = {
  goal: ({ action, state, meta }) => {
    const goal = action.payload;
    const teamName =
      action.payload.side === "home" ? meta.homeTeam.name : meta.awayTeam.name;
    const player =
      goal.player &&
      state.players[goal.side].find(
        (x: Yup.InferType<typeof playerSchema>) => x.id === goal.player
      );
    const tag = player
      ? `${player.name} (${
          player.number ? player.number + ", " : ""
        }${teamName})`
      : teamName;
    const time = clockTimeAt(state.clock, action.meta.ts);
    return (
      <span>
        {tag} at {Math.floor(time / 60 / 1000).toFixed(0)} minutes
      </span>
    );
  },
  resumeCurrentHalf: ({ action, state }) => {
    return <span>Half resumed</span>;
  },
  startHalf: () => <span>Started next half</span>,
  endHalf: () => <span>Half finished</span>,
  addStoppageTime: ({ action }) => (
    <span>Stoppage time: {action.payload.minutes} minutes</span>
  ),
};

export function GoalForm(props: ActionFormProps<State>) {
  const { values } =
    useFormikContext<Yup.InferType<typeof actionPayloadValidators["goal"]>>();
  const players =
    values.side === "home"
      ? props.currentState.players.home
      : values.side === "away"
      ? props.currentState.players.away
      : [];
  return (
    <div>
      <SegmentedSelectField
        name="side"
        title="Side"
        values={[
          ["home", props.meta.homeTeam.name],
          ["away", props.meta.awayTeam.name],
        ]}
      />
      <SelectField
        name="player"
        title="Player"
        // @ts-expect-error typing here is funky
        values={[[null, "Unknown"]].concat(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          players!.map((player) => [
            player.id,
            `${player.name} (${player.number})`,
          ])
        )}
      />
    </div>
  );
}

export function StoppageTimeForm() {
  return (
    <>
      <Field name="minutes" title="Minutes" type="number" independent />
    </>
  );
}

export function EditForm(props: { meta: EventMeta }) {
  return (
    <>
      <Field name="name" title="Name" independent />
      <SelectField
        name="ruleset"
        title="Ruleset"
        values={[
          ["_default", "Standard Rules"],
          ["sixtyMinutes", "60 Minute Matches"],
        ]}
      />
      <fieldset>
        <Title order={3}>{props.meta.homeTeam?.name ?? "Home Side"}</Title>
        <ArrayField
          name="players.home"
          title="Players"
          initialChildValue={{ name: "", number: "" }}
          renderChild={({ namespace }) => (
            <div>
              <RandomUUIDField name={namespace + "id"} />
              <Field name={namespace + "name"} title="Name" independent />
              <Field name={namespace + "number"} title="Number" independent />
            </div>
          )}
        />
      </fieldset>
      <fieldset>
        <Title order={3}>{props.meta.awayTeam?.name ?? "Away Side"}</Title>
        <ArrayField
          name="players.away"
          title="Players"
          initialChildValue={{ name: "", number: "" }}
          renderChild={({ namespace }) => (
            <div>
              <RandomUUIDField name={namespace + "id"} />
              <Field name={namespace + "name"} title="Name" independent />
              <Field name={namespace + "number"} title="Number" independent />
            </div>
          )}
        />
      </fieldset>
    </>
  );
}

export function RenderScore(props: { state: State; meta: EventMeta }) {
  const currentHalf =
    props.state.halves.length > 0
      ? props.state.halves[props.state.halves.length - 1]
      : null;
  return (
    <Stack align={"center"}>
      <Title>
        {props.meta.homeTeam.name} {props.state.scoreHome} -{" "}
        {props.meta.awayTeam.name} {props.state.scoreAway}
      </Title>
      <div>
        <RenderClock
          key={
            props.state.clock.state + props.state.clock.timeLastStartedOrStopped
          }
          clock={props.state.clock}
          precisionMs={0}
          precisionHigh={2}
        />
        {(currentHalf?.stoppageTime || 0) > 0 && (
          <span>+{currentHalf?.stoppageTime}</span>
        )}
      </div>
    </Stack>
  );
}

export const typeInfo: EventTypeInfo<State, typeof actions> = {
  reducer,
  stateSchema: schema,
  actionCreators: actions,
  actionPayloadValidators,
  actionRenderers,
  actionValidChecks,
};

export const components: EventComponents<typeof actions, State> = {
  EditForm,
  RenderScore,
  actionForms: {
    goal: GoalForm,
    addStoppageTime: StoppageTimeForm,
  },
};
