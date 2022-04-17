import { useFormikContext, Field } from "formik";
import * as Yup from "yup";
import {
  clockTimeAt,
  DownwardClock,
  formatMMSSMS,
  startClockAt,
  stopClockAt,
} from "../../clock";
import { RenderClock } from "../../components/Clock";
import { SelectField, ArrayField, RandomUUIDField } from "../../formFields";
import { createSlice } from "@reduxjs/toolkit";
import { ActionRenderers, BaseEvent, BaseEventType } from "../../types";
import {
  Action,
  ActionPayloadValidators,
  ActionValidChecks,
  wrapAction,
} from "../../eventStateHelpers";
import { TypographyStylesProvider } from "@mantine/core";

const playerSchema = Yup.object({
  id: Yup.string().uuid().required(),
  name: Yup.string().required(),
  position: Yup.string()
    .optional()
    .oneOf(["GS", "GA", "WA", "C", "WD", "GD", "GK"]),
});

type PlayerType = Yup.InferType<typeof playerSchema>;

const QUARTER_DURATION_MS = 15 * 60 * 1000; // 15 minutes

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

export interface State extends BaseEventType {
  players: {
    home: PlayerType[];
    away: PlayerType[];
  };
  scoreHome: number;
  scoreAway: number;
  quarters: Array<Yup.InferType<typeof quarterSchema>>;
  clock: Yup.InferType<typeof DownwardClock>;
}

const slice = createSlice({
  name: "netball",
  initialState: {
    id: "INVALID",
    type: "netball",
    name: "",
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
      reducer(state, action) {
        state.quarters.push({
          goals: [],
        });
        startClockAt(state.clock, action.meta.ts, QUARTER_DURATION_MS);
      },
      prepare() {
        return wrapAction({});
      },
    },
    pauseClock: {
      reducer(state, action) {
        stopClockAt(state.clock, action.meta.ts);
      },
      prepare() {
        return wrapAction({});
      },
    },
    resumeCurrentQuarter: {
      reducer(state, action) {
        state.quarters.push({
          goals: [],
        });
        startClockAt(
          state.clock,
          action.meta.ts,
          state.clock.timeLastStartedOrStopped
        );
      },
      prepare() {
        return wrapAction({});
      },
    },
  },
});

export const reducer = slice.reducer;
export const actions = slice.actions;
export const schema: Yup.SchemaOf<State> = BaseEvent.shape({
  players: Yup.object({
    home: Yup.array().of(playerSchema).default([]),
    away: Yup.array().of(playerSchema).default([]),
  }),
  scoreHome: Yup.number().required().default(0),
  scoreAway: Yup.number().required().default(0),
  clock: DownwardClock.shape({
    startingTime: Yup.number().default(QUARTER_DURATION_MS),
  }),
  quarters: Yup.array().of(quarterSchema).default([]),
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
  goal: ({ action, state }) => {
    const goal = action.payload;
    const player =
      goal.player &&
      state.players[goal.side].find(
        (x: Yup.InferType<typeof playerSchema>) => x.id === goal.player
      );
    const tag = player
      ? `${player.name} (${player.position ? player.position + ", " : ""}${
          goal.side
        })`
      : goal.side;
    const time = clockTimeAt(state.clock, action.meta.ts);
    return (
      <span>
        {tag} at{" "}
        {Math.floor((QUARTER_DURATION_MS - time) / 60 / 1000).toFixed(0)}{" "}
        minutes (Q
        {state.quarters.length})
      </span>
    );
  },
  pauseClock: ({ action, state }) => {
    const time = clockTimeAt(state.clock, action.meta.ts);
    return (
      <span>
        Clock paused at {formatMMSSMS(QUARTER_DURATION_MS - time, 0, 2)}
      </span>
    );
  },
  resumeCurrentQuarter: ({ action, state }) => {
    return <span>Clock resumed</span>;
  },
  startNextQuarter: () => <span>Started next quarter</span>,
};

export function RenderScore(props: { state: State }) {
  console.log("RenderScore rendered!", props.state);
  return (
    <TypographyStylesProvider>
      <h1>
        Home {props.state.scoreHome} - Away {props.state.scoreAway}
      </h1>
      <small>Quarter {props.state.quarters.length}</small>
      <RenderClock
        clock={props.state.clock}
        precisionHigh={2}
        precisionMs={0}
      />
    </TypographyStylesProvider>
  );
}

export interface ActionFormProps<TState> {
  currentState: TState;
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
      <SelectField
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
              <SelectField
                name={namespace + "position"}
                title="Position"
                values={[]}
              />
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
              <SelectField
                name={namespace + "position"}
                title="Position"
                values={[]}
              />
            </div>
          )}
        />
      </fieldset>
    </div>
  );
}
