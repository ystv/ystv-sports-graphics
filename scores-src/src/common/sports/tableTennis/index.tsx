import { useFormikContext } from "formik";
import * as Yup from "yup";
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
  number: Yup.number().optional(),
});

type PlayerType = Yup.InferType<typeof playerSchema>;

const gameSchema = Yup.object({
  rallies: Yup.array()
    .of(
      Yup.object({
        side: Yup.string().oneOf(["home", "away"]).required(),
        player: Yup.string().uuid().nullable().default(null),
      })
    )
    .required()
    .default([]),
});

export interface State extends BaseEventStateType {
  players: {
    home: PlayerType[];
    away: PlayerType[];
  };
  currentGameScoreHome: number;
  currentGameScoreAway: number;
  gamesHome: number;
  gamesAway: number;
  lastGameWinner?: "home" | "away";
  games: Array<Yup.InferType<typeof gameSchema>>;
}

const slice = createSlice({
  name: "badminton",
  initialState: {
    id: "INVALID",
    type: "badminton",
    name: "",
    startTime: "2022-04-29T09:00:00+01:00",
    worthPoints: 0,
    players: {
      home: [],
      away: [],
    },
    currentGameScoreHome: 0,
    currentGameScoreAway: 0,
    gamesHome: 0,
    gamesAway: 0,
    games: [],
  } as State,
  reducers: {
    rally(
      state,
      action: PayloadAction<{ side: "home" | "away"; player: string | null }>
    ) {
      if (action.payload.side === "home") {
        state.currentGameScoreHome++;
        state.lastGameWinner = "home";
      } else {
        state.currentGameScoreAway++;
        state.lastGameWinner = "away";
      }
      state.games[state.games.length - 1].rallies.push({
        side: action.payload.side,
        player: action.payload.player,
      });
    },
    startNextGame(state) {
      if (state.games.length >= 1) {
        if (state.currentGameScoreHome > state.currentGameScoreAway) {
          state.gamesHome++;
        } else {
          state.gamesAway++;
        }
      }
      state.currentGameScoreHome = 0;
      state.currentGameScoreAway = 0;
      state.games.push({
        rallies: [],
      });
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
  currentGameScoreHome: Yup.number().required().default(0),
  currentGameScoreAway: Yup.number().required().default(0),
  gamesHome: Yup.number().required().default(0),
  gamesAway: Yup.number().required().default(0),
  games: Yup.array().of(gameSchema).default([]),
  lastGameWinner: Yup.mixed<"home" | "away">()
    .oneOf(["home", "away"])
    .optional(),
});

export const actionPayloadValidators: ActionPayloadValidators<
  typeof slice["actions"]
> = {
  rally: Yup.object({
    side: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).required(),
    player: Yup.string().uuid().nullable().default(null),
  }),
  startNextGame: Yup.object({}),
};

export const actionValidChecks: ActionValidChecks<
  State,
  typeof slice["actions"]
> = {
  rally: (state) => state.games.length > 0,
};

export const actionRenderers: ActionRenderers<
  typeof actions,
  typeof slice["caseReducers"],
  State
> = {
  rally: ({ action, state }) => {
    const goal = action.payload;
    const player =
      goal.player &&
      state.players[goal.side].find(
        (x: Yup.InferType<typeof playerSchema>) => x.id === goal.player
      );
    const tag = player
      ? `${player.name} (${player.number ? player.number + ", " : ""}${
          goal.side
        })`
      : goal.side;
    return (
      <span>
        {tag} (game {state.games.length})
      </span>
    );
  },
  startNextGame: ({ state }) => (
    <span>
      Started next game{" "}
      {state.lastGameWinner && `(last game won by ${state.lastGameWinner})`}
    </span>
  ),
};

export function RenderScore(props: { state: State }) {
  console.log("RenderScore rendered!", props.state);
  return (
    <TypographyStylesProvider>
      <h1>
        Home {props.state.currentGameScoreHome} - Away{" "}
        {props.state.currentGameScoreAway}
      </h1>
      <h2>
        Games {props.state.gamesHome} - {props.state.gamesAway}
      </h2>
      <small>Set {props.state.games.length}</small>
    </TypographyStylesProvider>
  );
}

export interface ActionFormProps<TState> {
  currentState: TState;
}

export function RallyForm(props: ActionFormProps<State>) {
  const { values } =
    useFormikContext<Yup.InferType<typeof actionPayloadValidators["rally"]>>();
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
            `${player.name} (${player.number})`,
          ])
        )}
      />
    </div>
  );
}

export function EditForm() {
  return (
    <>
      <Field name="name" title="Name" independent />
      <fieldset>
        <Title order={3}>Home Side</Title>
        <ArrayField
          name="players.home"
          title="Players"
          initialChildValue={{ name: "", number: "" }}
          renderChild={({ namespace }) => (
            <div>
              <RandomUUIDField name={namespace + "id"} />
              <Field name={namespace + "name"} title="Name" independent />
              <Field name={namespace + "number"} title="Number" type="number" />
            </div>
          )}
        />
      </fieldset>
      <fieldset>
        <Title order={3}>Away Side</Title>
        <ArrayField
          name="players.away"
          title="Players"
          initialChildValue={{ name: "", number: "" }}
          renderChild={({ namespace }) => (
            <div>
              <RandomUUIDField name={namespace + "id"} />
              <Field name={namespace + "name"} title="Name" independent />
              <Field name={namespace + "number"} title="Number" type="number" />
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
    rally: RallyForm,
  },
};
