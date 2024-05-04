// import { createGenericSport } from "../_generic";
//
// const { components, typeInfo } = createGenericSport(
//   "rosesFencing",
//   [1],
//   0,
//   (n) => `Bout ${n}`
// );
//
// components.actionForms.
//
// // components.actionForms.addPoints = ({ currentState, meta }) => {
// //   return (
// //     <div>
// //       <h2>Add Points</h2>
// //       <p>Current Score: {currentState.}</p>
// //       <input
// //         type="number"
// //         value={meta.state.points}
// //         onChange={(e) => meta.setState({ points: parseInt(e.target.value) })}
// //       />
// //     </div>
// //   );
// //
// // }
//
// export type State = ReturnType<typeof typeInfo["reducer"]>;
//

import * as Yup from "yup";
import { clockTimeAt, formatMMSSMS } from "../../clock";
import { createSlice } from "@reduxjs/toolkit";
import {
  Action,
  ActionPayloadValidators,
  ActionRenderers,
  ActionValidChecks,
  BaseEventStateType,
  EventComponents,
  EventTypeInfo,
} from "../../types";
import { wrapAction } from "../../eventStateHelpers";
import {
  ArrayField,
  Checkbox,
  Field,
  RandomUUIDField,
  SelectField,
} from "../../formFields";
import { Button, Group, Space, Stack, Text, Title } from "@mantine/core";
import { capitalize } from "lodash-es";
import { RenderClock } from "../../components/Clock";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons";
import { useFormikContext } from "formik";

export interface State extends BaseEventStateType {
  scoreHome: number;
  scoreAway: number;
  /** The index of the current half/quarter/sub-division of this event, one-based! */
  segment: number;
  segmentPoints: Point[][];
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

interface Point {
  side: "home" | "away";
  player?: string | null;
}

const PlayerSchema: Yup.SchemaOf<PlayerType> = Yup.object({
  id: Yup.string().uuid().required(),
  name: Yup.string().required(),
  designation: Yup.string().required(),
  startsOnBench: Yup.boolean().required().default(false),
});

const PointSchema: Yup.SchemaOf<Point> = Yup.object({
  side: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).required(),
  player: Yup.string().uuid().optional().nullable(),
});

const playersSchema = Yup.object({
  home: Yup.array().of(PlayerSchema.required()).required().default([]),
  away: Yup.array().of(PlayerSchema.required()).required().default([]),
});
const schema: Yup.SchemaOf<State> = Yup.object().shape({
  scoreHome: Yup.number().required().default(0),
  scoreAway: Yup.number().required().default(0),
  segment: Yup.number().required().default(0),
  players: playersSchema.optional(),
  segmentPoints: Yup.array()
    .of(Yup.array().of(PointSchema))
    .required()
    .default([]),
});

const segmentNameFn = (_: number) => "Bout";

const slice = createSlice({
  name: "rosesFencing",
  initialState: {
    id: "",
    name: "",
    type: "rosesFencing",
    startTime: "2022-04-29T09:00:00+01:00",
    worthPoints: 0,
    scoreHome: 0,
    scoreAway: 0,
    segment: 0,
    players: {
      home: [],
      away: [],
    },
    segmentPoints: [],
  } as State,
  reducers: {
    startBout: {
      reducer(state, action: Action) {
        state.segment++;
        state.segmentPoints.push([]);
      },
      prepare() {
        return wrapAction({ payload: {} });
      },
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
    doubleTap: {
      reducer(state) {
        state.scoreHome++;
        state.scoreAway++;
        state.segmentPoints[state.segmentPoints.length - 1].push({
          side: "home",
          player: null,
        });
        state.segmentPoints[state.segmentPoints.length - 1].push({
          side: "away",
          player: null,
        });
      },
      prepare() {
        return wrapAction({ payload: {} });
      },
    },
    resetState: {
      reducer(state) {
        state.segmentPoints = [];
        state.segment = 0;
        state.scoreHome = 0;
        state.scoreAway = 0;
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
  startBout: Yup.object({}),
  addPoints: Yup.object({
    side: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).required(),
    points: Yup.number().required().min(0),
    player: Yup.string().uuid().optional().nullable(),
  }),
  resetState: Yup.object({}),
  doubleTap: Yup.object({}),
};

const actionValidChecks: ActionValidChecks<State, typeof slice["actions"]> = {};

const actionRenderers: ActionRenderers<
  typeof slice["actions"],
  typeof slice["caseReducers"],
  State
> = {
  startBout: () => <span>Bout started.</span>,
  addPoints: ({ state, meta, action }) => {
    let tag: string;
    const teamName =
      action.payload.side === "home" ? meta.homeTeam.name : meta.awayTeam.name;
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
        {tag}: +{action.payload.points} points
      </span>
    );
  },
  doubleTap: () => <span>Double touch</span>,
  resetState: () => <strong>State reset.</strong>,
};

const hiddenActions = new Set(["addPoints", "doubleTap"] as Array<
  keyof typeof slice["actions"]
>);

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
    </>
  ),
  RenderScore: ({ state, meta, act, showActModal }) => {
    return (
      <Stack>
        <Text color="dimmed">
          {capitalize(segmentNameFn(state.segment))} {state.segment}
        </Text>
        <Group>
          <Stack>
            <Text size="sm" weight="bold" transform="uppercase">
              {meta.homeTeam.name}
            </Text>
            <Text size="xl">{state.scoreHome}</Text>
            <Button
              disabled={state.segmentPoints.length === 0}
              onClick={() => act("addPoints", { side: "home", points: 1 })}
              size="lg"
            >
              +{1}
            </Button>
          </Stack>
          <Stack>
            <Text size="sm" weight="bold" transform="uppercase"></Text>
            <Text size="xl"></Text>
            <Button
              disabled={state.segmentPoints.length === 0}
              onClick={() => {
                act("doubleTap", undefined);
              }}
              size="lg"
            >
              Double Touch
            </Button>
          </Stack>
          <Stack>
            <Text size="sm" weight="bold" transform="uppercase">
              {meta.awayTeam.name}
            </Text>
            <Text size="xl">{state.scoreAway}</Text>
            <Button
              disabled={state.segmentPoints.length === 0}
              onClick={() => act("addPoints", { side: "away", points: 1 })}
              size="lg"
            >
              +{1}
            </Button>
          </Stack>
        </Group>
        <Space h="lg" />
      </Stack>
    );
  },
  actionForms: {
    startBout: ({ currentState }) => {
      if (currentState.segment > 0) {
        return (
          <p>
            This will start a new {segmentNameFn(currentState.segment)}. If you
            want to resume the current one, use <code>Resume Clock</code>.
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

export { components, typeInfo };
