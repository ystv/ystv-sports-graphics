import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useFormikContext } from "formik";
import { startCase } from "lodash-es";
import * as Yup from "yup";
import {
  clockTimeAt,
  formatMMSSMS,
  startClockAt,
  stopClockAt,
  UpwardClock,
  UpwardClockType,
} from "../../clock";
import { RenderClock } from "../../components/Clock";
import { wrapAction } from "../../eventStateHelpers";
import {
  ArrayField,
  Field,
  RandomUUIDField,
  SegmentedSelectField,
  SelectField,
} from "../../formFields";
import {
  Action,
  ActionFormProps,
  ActionPayloadValidators,
  ActionRenderers,
  ActionValidChecks,
  BaseEventStateType,
  EventComponents,
  EventTypeInfo,
} from "../../types";

const playerSchema = Yup.object({
  id: Yup.string().uuid().required(),
  name: Yup.string().required(),
  number: Yup.string().matches(/^[0-9]*$/, "must be a number"),
});

type PlayerType = Yup.InferType<typeof playerSchema>;

type ScoreType = "try" | "conversion" | "penaltyGoal" | "dropGoal";

const POINTS_VALUE: Record<ScoreType, number> = {
  try: 5,
  conversion: 2,
  penaltyGoal: 3,
  dropGoal: 3,
};

export interface State extends BaseEventStateType {
  scoreAway: number;
  scoreHome: number;
  players: {
    home: PlayerType[];
    away: PlayerType[];
  };
  clock: UpwardClockType;
  halves: Array<{
    timeLost: number;
    actions: Array<{
      type: "try" | "conversion" | "penaltyGoal" | "dropGoal";
      time: number;
      side: "home" | "away";
      player: string | null;
    }>;
  }>;
}

export const schema: Yup.SchemaOf<State> = Yup.object().shape({
  scoreHome: Yup.number().default(0),
  scoreAway: Yup.number().default(0),
  players: Yup.object({
    home: Yup.array().of(playerSchema).required().default([]),
    away: Yup.array().of(playerSchema).required().default([]),
  }).required(),
  clock: UpwardClock,
  halves: Yup.array()
    .of(
      Yup.object({
        timeLost: Yup.number().required().default(0),
        actions: Yup.array()
          .of(
            Yup.object({
              type: Yup.mixed<
                "try" | "conversion" | "penaltyGoal" | "dropGoal"
              >()
                .required()
                .oneOf(["try", "conversion", "penaltyGoal", "dropGoal"]),
              time: Yup.number().required(),
              side: Yup.mixed<"home" | "away">()
                .oneOf(["home", "away"])
                .required(),
              player: Yup.string().uuid().required().nullable(),
            })
          )
          .required()
          .default([]),
      })
    )
    .required()
    .max(2)
    .default([]),
});

const MAX_HALVES_WITHOUT_EXTRA_TIME = 2;
const HALF_DURATION_MS = 40 * 60 * 1000;
const EXTRA_TIME_DURATION_MS = 10 * 60 * 1000;

const slice = createSlice({
  name: "rugbyUnion",
  initialState: {
    name: "",
    type: "rugbyUnion",
    id: "",
    startTime: "2022-04-29T09:00:00+01:00",
    worthPoints: 0,
    scoreAway: 0,
    scoreHome: 0,
    players: {
      away: [],
      home: [],
    },
    clock: {
      type: "upward",
      state: "stopped",
      timeLastStartedOrStopped: 0,
      wallClockLastStarted: 0,
    },
    halves: [],
  } as State,
  reducers: {
    score: {
      reducer(
        state,
        action: Action<{
          type: ScoreType;
          side: "home" | "away";
          player: string | null;
        }>
      ) {
        if (action.payload.side === "home") {
          state.scoreHome += POINTS_VALUE[action.payload.type];
        } else {
          state.scoreAway += POINTS_VALUE[action.payload.type];
        }
        state.halves[state.halves.length - 1].actions.push({
          type: action.payload.type,
          side: action.payload.side,
          player: action.payload.player,
          time: clockTimeAt(state.clock, action.meta.ts),
        });
      },
      prepare(payload: {
        type: ScoreType;
        side: "home" | "away";
        player: string | null;
      }) {
        return wrapAction({ payload });
      },
    },
    startHalf: {
      reducer(state, action: Action) {
        state.halves.push({
          actions: [],
          timeLost: 0,
        });
        if (state.halves.length <= MAX_HALVES_WITHOUT_EXTRA_TIME) {
          state.clock.timeLastStartedOrStopped =
            HALF_DURATION_MS * (state.halves.length - 1);
        } else {
          state.clock.timeLastStartedOrStopped =
            HALF_DURATION_MS * MAX_HALVES_WITHOUT_EXTRA_TIME +
            EXTRA_TIME_DURATION_MS *
              (state.halves.length - MAX_HALVES_WITHOUT_EXTRA_TIME - 1);
        }
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
    addTimeLost(state, action: PayloadAction<{ minutes: number }>) {
      state.halves[state.halves.length - 1].timeLost = action.payload.minutes;
    },
  },
});

export const reducer = slice.reducer;
export const actions = slice.actions;

export const actionPayloadValidators: ActionPayloadValidators<
  typeof slice["actions"]
> = {
  score: Yup.object({
    type: Yup.mixed<ScoreType>()
      .oneOf(["try", "conversion", "penaltyGoal", "dropGoal"])
      .required(),
    side: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).required(),
    player: Yup.string().uuid().nullable().default(null),
  }),
  startHalf: Yup.object({}),
  pauseClock: Yup.object({}),
  resumeCurrentHalf: Yup.object({}),
  endHalf: Yup.object({}),
  addTimeLost: Yup.object({
    minutes: Yup.number().required().min(0),
  }),
};

export const actionValidChecks: ActionValidChecks<
  State,
  typeof slice["actions"]
> = {
  score: (state) => state.halves.length > 0,
  pauseClock: (state) => state.clock.state === "running",
  startHalf: (state) =>
    // Safe to use current time here because this isn't called from reducers
    state.halves.length === 0 ||
    clockTimeAt(state.clock, new Date().valueOf()) === 0,
  resumeCurrentHalf: (state) =>
    state.halves.length > 0 && state.clock.state === "stopped",
  endHalf: (state) => state.clock.state === "running",
  addTimeLost: (state) => state.clock.state === "running",
};

export const actionRenderers: ActionRenderers<
  typeof actions,
  typeof slice["caseReducers"],
  State
> = {
  score: ({ action, state }) => {
    const goal = action.payload;
    const player =
      goal.player &&
      state.players[goal.side].find(
        (x: Yup.InferType<typeof playerSchema>) => x.id === goal.player
      );
    const tag =
      action.payload.type +
      " by " +
      (player
        ? `${player.name} (${player.number ? player.number + ", " : ""}${
            goal.side
          })`
        : goal.side);
    const time = clockTimeAt(state.clock, action.meta.ts);
    return (
      <span>
        {tag} at {Math.floor(time / 60 / 1000).toFixed(0)} minutes
      </span>
    );
  },
  pauseClock: ({ action, state }) => {
    const time = clockTimeAt(state.clock, action.meta.ts);
    return <span>Clock paused at {formatMMSSMS(time, 0, 2)}</span>;
  },
  resumeCurrentHalf: () => {
    return <span>Clock resumed</span>;
  },
  startHalf: () => <span>Started next half</span>,
  endHalf: () => <span>Half ended</span>,
  addTimeLost: ({ action }) => (
    <span>Time lost: {action.payload.minutes} minutes</span>
  ),
};

export function EditForm() {
  return (
    <div>
      <Field name="name" title="Name" independent />
      <fieldset>
        <label>Home Side</label>
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
        <label>Away Side</label>
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
    </div>
  );
}

export function RenderScore(props: { state: State }) {
  const currentHalf =
    props.state.halves.length > 0
      ? props.state.halves[props.state.halves.length - 1]
      : null;
  return (
    <div>
      <h1>
        Home {props.state.scoreHome} - Away {props.state.scoreAway}
      </h1>
      <div>
        <RenderClock
          key={props.state.clock.state}
          clock={props.state.clock}
          precisionMs={0}
          precisionHigh={2}
        />
        {(currentHalf?.timeLost || 0) > 0 && (
          <span>+{currentHalf?.timeLost}</span>
        )}
      </div>
    </div>
  );
}

function ScoreForm(props: ActionFormProps<State>) {
  const { values } =
    useFormikContext<Yup.InferType<typeof actionPayloadValidators["score"]>>();
  const players =
    values.side === "home"
      ? props.currentState.players.home
      : values.side === "away"
      ? props.currentState.players.away
      : [];
  return (
    <div>
      <SegmentedSelectField
        name="type"
        title="Type"
        values={Object.keys(POINTS_VALUE).map((k) => [
          k,
          `${startCase(k)} (${POINTS_VALUE[k as ScoreType]} pts)`,
        ])}
      />
      <SegmentedSelectField
        name="side"
        title="Side"
        values={[
          ["home", "Home"],
          ["away", "Away"],
        ]}
      />
      <SelectField
        name="player"
        title="Player"
        values={
          [[null, "Unknown"]].concat(
            players.map((player) => [
              player.id,
              `${player.name} (${player.number})`,
            ])
          ) as [[string | null, string]]
        }
      />
    </div>
  );
}

export const typeInfo: EventTypeInfo<State, typeof actions> = {
  stateSchema: schema,
  reducer,
  actionCreators: actions,
  actionPayloadValidators,
  actionRenderers,
  actionValidChecks,
};

export const components: EventComponents<typeof actions, State> = {
  EditForm,
  RenderScore,
  actionForms: {
    score: ScoreForm,
    addTimeLost: () => (
      <Field type="number" name="minutes" title="Time Lost (minutes)" />
    ),
  },
};
