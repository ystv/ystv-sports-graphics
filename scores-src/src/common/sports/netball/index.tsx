import { useFormikContext, Field } from "formik";
import * as Yup from "yup";
import {
  clockTimeAt,
  DownwardClock,
  startClockAt,
  stopClock,
} from "../../clock";
import { RenderClock } from "../../components/Clock";
import { SelectField, ArrayField, RandomUUIDField } from "../../formFields";
import {
  createSlice,
  Slice,
  SliceCaseReducers,
  CaseReducer,
  PayloadAction,
} from "@reduxjs/toolkit";
import { BaseEvent, BaseEventType } from "../../types";
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
const MAX_QUARTERS_INCLUDING_EXTRA_TIME = 6;

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
    startQuarter: {
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
    pauseClock(state) {
      stopClock(state.clock);
    },
    resumeCurrentQuarter: {
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
    endCurrentQuarter(state) {
      stopClock(state.clock);
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
  startQuarter: Yup.object({}),
  endCurrentQuarter: Yup.object({}),
  pauseClock: Yup.object({}),
  resumeCurrentQuarter: Yup.object({}),
};

export const actionValidChecks: ActionValidChecks<
  State,
  typeof slice["actions"]
> = {
  goal: (state) => state.quarters.length > 0,
  pauseClock: (state) => state.clock.state === "running",
  endCurrentQuarter: (state) => state.quarters.length > 0,
  resumeCurrentQuarter: (state) =>
    state.quarters.length > 0 && state.clock.state === "stopped",
};

export function RenderScore(props: { state: State; actions: React.ReactNode }) {
  console.log("RenderScore rendered!", props.state);
  return (
    <TypographyStylesProvider>
      <h1>
        Home {props.state.scoreHome} - Away {props.state.scoreAway}
      </h1>
      <small>Quarter {props.state.quarters.length}</small>
      <div>
        <RenderClock
          clock={props.state.clock}
          precisionMs={0}
          precisionHigh={2}
        />
      </div>
      {props.actions}
      <h2>Goals</h2>
      <ul>
        {props.state.quarters
          .flatMap((x, q) =>
            x.goals.slice().map((goal) => ({ ...goal, quarter: q + 1 }))
          )
          .reverse()
          .map((goal) => {
            const player =
              goal.player &&
              // @ts-expect-error goal.side indexing is strange
              props.state.players[goal.side].find(
                (x: Yup.InferType<typeof playerSchema>) => x.id === goal.player
              );
            const tag = player
              ? `${player.name} (${
                  player.position ? player.position + ", " : ""
                }${goal.side})`
              : goal.side;
            return (
              <li key={goal.time}>
                {tag} at{" "}
                {Math.floor(
                  (QUARTER_DURATION_MS - goal.time) / 60 / 1000
                ).toFixed(0)}{" "}
                minutes (Q{goal.quarter})
              </li>
            );
          })}
      </ul>
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
