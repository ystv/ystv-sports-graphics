import { useFormikContext } from "formik";
import * as Yup from "yup";
import {
  clockTimeAt,
  DownwardClock,
  formatMMSSMS,
  startClockAt,
  stopClockAt,
} from "../../clock";
import { RenderClock } from "../../components/Clock";
import {
  SelectField,
  ArrayField,
  RandomUUIDField,
  Field,
  SegmentedSelectField,
} from "../../formFields";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ActionRenderers,
  BaseEventStateType,
  EventComponents,
  EventMeta,
  EventTypeInfo,
} from "../../types";
import {
  Action,
  ActionPayloadValidators,
  ActionValidChecks,
} from "../../types";
import { Title, TypographyStylesProvider } from "@mantine/core";
import { wrapAction } from "../../eventStateHelpers";

const playerSchema = Yup.object({
  id: Yup.string().uuid().required(),
  name: Yup.string().required(),
  position: Yup.string()
    .optional()
    .oneOf(["GS", "GA", "WA", "C", "WD", "GD", "GK", "Sub"]),
});

type PlayerType = Yup.InferType<typeof playerSchema>;

const quarterSchema = Yup.object({
  goals: Yup.array()
    .of(
      Yup.object({
        time: Yup.number().required(),
        side: Yup.string().oneOf(["home", "away"]).required(),
        player: Yup.string().uuid().nullable().default(null),
      })
    )
    .required()
    .default([]),
});

const RULESETS = {
  _default: {
    quarterDurationMs: 15 * 60 * 1000,
  },
  tenMinuteQuarters: {
    quarterDurationMs: 10 * 60 * 1000,
  },
  eightMinuteQuarters: {
    quarterDurationMs: 8 * 60 * 1000,
  },
};

export interface State extends BaseEventStateType {
  players: {
    home: PlayerType[];
    away: PlayerType[];
  };
  scoreHome: number;
  scoreAway: number;
  quarters: Array<Yup.InferType<typeof quarterSchema>>;
  clock: Yup.InferType<typeof DownwardClock>;
  ruleset: keyof typeof RULESETS;
}

const slice = createSlice({
  name: "netball",
  initialState: {
    id: "INVALID",
    type: "netball",
    name: "",
    startTime: "2022-04-29T09:00:00+01:00",
    worthPoints: 0,
    players: {
      home: [],
      away: [],
    },
    scoreHome: 0,
    scoreAway: 0,
    quarters: [],
    clock: {
      type: "downward",
      state: "stopped",
      wallClockLastStarted: -1,
      timeLastStartedOrStopped: 0,
    },
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
        state.quarters[state.quarters.length - 1].goals.push({
          side: action.payload.side,
          player: action.payload.player,
          time: clockTimeAt(state.clock, action.meta.ts),
        });
      },
      prepare(payload: { side: "home" | "away"; player: string | null }) {
        return wrapAction({ payload });
      },
    },
    startNextQuarter: {
      reducer(state, action: Action) {
        state.quarters.push({
          goals: [],
        });
        startClockAt(
          state.clock,
          action.meta.ts,
          RULESETS[state.ruleset ?? "_default"].quarterDurationMs
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
    resumeCurrentQuarter: {
      reducer(state, action: Action) {
        startClockAt(
          state.clock,
          action.meta.ts,
          state.clock.timeLastStartedOrStopped
        );
      },
      prepare() {
        return wrapAction({ payload: {} });
      },
    },
  },
});

export const reducer = slice.reducer;
export const actions = slice.actions;
export const schema: Yup.SchemaOf<State> = Yup.object().shape({
  players: Yup.object({
    home: Yup.array().of(playerSchema).default([]),
    away: Yup.array().of(playerSchema).default([]),
  }),
  scoreHome: Yup.number().required().default(0),
  scoreAway: Yup.number().required().default(0),
  clock: DownwardClock.shape({
    startingTime: Yup.number().default(RULESETS._default.quarterDurationMs),
  }),
  quarters: Yup.array().of(quarterSchema).default([]),
  ruleset: Yup.mixed<keyof typeof RULESETS>()
    .oneOf(["_default", "tenMinuteQuarters", "eightMinuteQuarters"])
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
  startNextQuarter: Yup.object({}),
  pauseClock: Yup.object({}),
  resumeCurrentQuarter: Yup.object({}),
};

export const actionValidChecks: ActionValidChecks<
  State,
  typeof slice["actions"]
> = {
  goal: (state) => state.quarters.length > 0,
  pauseClock: (state) => state.clock.state === "running",
  startNextQuarter: (state) =>
    // Safe to use current time here because this isn't called from reducers
    state.quarters.length === 0 ||
    clockTimeAt(state.clock, new Date().valueOf()) === 0,
  resumeCurrentQuarter: (state) =>
    state.quarters.length > 0 && state.clock.state === "stopped",
};

export const actionRenderers: ActionRenderers<
  typeof actions,
  typeof slice["caseReducers"],
  State
> = {
  goal: ({ action, state, meta }) => {
    const goal = action.payload;
    const player =
      goal.player &&
      state.players[goal.side].find(
        (x: Yup.InferType<typeof playerSchema>) => x.id === goal.player
      );
    const teamName =
      action.payload.side === "home" ? meta.homeTeam.name : meta.awayTeam.name;
    const tag = player
      ? `${player.name} (${
          player.position ? player.position + ", " : ""
        }${teamName})`
      : teamName;
    const time = clockTimeAt(state.clock, action.meta.ts);
    return (
      <span>
        {tag} at{" "}
        {Math.floor(
          (RULESETS[state.ruleset ?? "_default"].quarterDurationMs - time) /
            60 /
            1000
        ).toFixed(0)}{" "}
        minutes (Q
        {state.quarters.length})
      </span>
    );
  },
  pauseClock: ({ action, state }) => {
    const time = clockTimeAt(state.clock, action.meta.ts);
    return (
      <span>
        Clock paused at{" "}
        {formatMMSSMS(
          RULESETS[state.ruleset ?? "_default"].quarterDurationMs - time,
          0,
          2
        )}
      </span>
    );
  },
  resumeCurrentQuarter: ({ action, state }) => {
    return <span>Clock resumed</span>;
  },
  startNextQuarter: () => <span>Started next quarter</span>,
};

export function RenderScore(props: { state: State; meta: EventMeta }) {
  console.log("RenderScore rendered!", props.state);
  return (
    <TypographyStylesProvider>
      <h1>
        {props.meta.homeTeam.name} {props.state.scoreHome} -{" "}
        {props.meta.awayTeam.name} {props.state.scoreAway}
      </h1>
      <small>Quarter {props.state.quarters.length}</small>
      <RenderClock
        key={
          props.state.clock.state + props.state.clock.timeLastStartedOrStopped
        }
        clock={props.state.clock}
        precisionHigh={2}
        precisionMs={0}
      />
    </TypographyStylesProvider>
  );
}

export interface ActionFormProps<TState> {
  currentState: TState;
  meta: EventMeta;
}

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
          players.map((player) => [
            player.id,
            `${player.name} (${player.position})`,
          ])
        )}
      />
    </div>
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
          ["tenMinuteQuarters", "Ten Minute Quarters"],
          ["eightMinuteQuarters", "Eight Minute Quarters"],
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
              <SelectField
                name={namespace + "position"}
                title="Position"
                values={[
                  ["GK", "GK"],
                  ["GD", "GD"],
                  ["WD", "WD"],
                  ["C", "C"],
                  ["GA", "GA"],
                  ["WA", "WA"],
                  ["GS", "GS"],
                  ["Sub", "Sub"],
                ]}
              />
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
              <SelectField
                name={namespace + "position"}
                title="Position"
                values={[
                  ["GK", "GK"],
                  ["GD", "GD"],
                  ["WD", "WD"],
                  ["C", "C"],
                  ["GA", "GA"],
                  ["WA", "WA"],
                  ["GS", "GS"],
                  ["Sub", "Sub"],
                ]}
              />
            </div>
          )}
        />
      </fieldset>
    </>
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
  },
};
