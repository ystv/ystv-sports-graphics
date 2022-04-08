import { useFormikContext, Field } from "formik";
import * as Yup from "yup";
import { currentTime, DownwardClock, startClock, stopClock } from "../../clock";
import { RenderClock } from "../../components/Clock";
import { SelectField, ArrayField, RandomUUIDField } from "../../formFields";
import {
  ActionFormProps,
  BaseEvent,
  EventActionFunctions,
  EventActionTypes,
  EventTypeInfo,
} from "../../types";

const playerSchema = Yup.object({
  id: Yup.string().uuid().required(),
  name: Yup.string().required(),
  position: Yup.string()
    .optional()
    .oneOf(["GS", "GA", "WA", "C", "WD", "GD", "GK"]),
});

const FIFTEEN_MINUTES_AS_MS = 15 * 60 * 1000;
const MAX_QUARTERS_INCLUDING_EXTRA_TIME = 6;

export const schema = BaseEvent.shape({
  scoreHome: Yup.number().default(0),
  scoreAway: Yup.number().default(0),
  players: Yup.object({
    home: Yup.array().of(playerSchema).required().default([]),
    away: Yup.array().of(playerSchema).required().default([]),
  }).required(),
  clock: DownwardClock.shape({
    startingTime: Yup.number().required().default(FIFTEEN_MINUTES_AS_MS),
  }),
  quarters: Yup.array()
    .of(
      Yup.object({
        goals: Yup.array()
          .of(
            Yup.object({
              time: Yup.number().required(),
              side: Yup.string().oneOf(["home", "away"]).required(),
              player: Yup.string().uuid().required().nullable().default(null),
            })
          )
          .required()
          .default([]),
      })
    )
    .required()
    .max(MAX_QUARTERS_INCLUDING_EXTRA_TIME)
    .default([]),
});

type ValueType = Yup.InferType<typeof schema>;

export const actionTypes: EventActionTypes<typeof schema> = {
  goal: {
    schema: Yup.object({
      side: Yup.string().oneOf(["home", "away"]).required(),
      player: Yup.string().required().min(1), // can be "UNKNOWN"
    }).required(),
    valid: (val) => val.clock.state === "running",
  },
  startQuarter: {
    schema: Yup.object({}),
    valid: (val) =>
      val.clock.state === "stopped" &&
      val.quarters.length < MAX_QUARTERS_INCLUDING_EXTRA_TIME,
  },
  pauseClock: {
    schema: Yup.object({}),
    valid: (val) => val.clock.state === "running",
  },
  resumeCurrentQuarter: {
    schema: Yup.object({}),
    valid: (val) =>
      val.clock.state === "stopped" &&
      val.quarters.length < MAX_QUARTERS_INCLUDING_EXTRA_TIME &&
      val.quarters.length > 0,
  },
  endCurrentQuarter: {
    schema: Yup.object({}),
    valid: (val) => val.clock.state === "running",
  },
};

export const actionFuncs: EventActionFunctions<
  typeof schema,
  typeof actionTypes
> = {
  goal(val, data) {
    if (data.side === "home") {
      val.scoreHome++;
    } else {
      val.scoreAway++;
    }
    if (data.player === "UNKNOWN") {
      data.player = null;
    }
    val.quarters[val.quarters.length - 1].goals.push({
      side: data.side,
      player: data.player,
      time: currentTime(val.clock),
    });
  },
  startQuarter(val, data) {
    val.quarters.push({
      goals: [],
    });
    // TODO: last two quarters need to be 7m
    startClock(val.clock, FIFTEEN_MINUTES_AS_MS);
  },
  pauseClock(val, data) {
    stopClock(val.clock);
  },
  endCurrentQuarter(val, data) {
    stopClock(val.clock);
  },
  resumeCurrentQuarter(val, data) {
    startClock(val.clock);
  },
};

export function RenderScore(props: {
  value: ValueType;
  actions: React.ReactNode;
}) {
  return (
    <div>
      <h1>
        Home {props.value.scoreHome} - Away {props.value.scoreAway}
      </h1>
      <small>Quarter {props.value.quarters.length}</small>
      <div>
        <RenderClock
          clock={props.value.clock}
          precisionMs={0}
          precisionHigh={2}
        />
      </div>
      {props.actions}
      <h2>Goals</h2>
      <ul>
        {props.value.quarters
          .flatMap((x) => x.goals.slice())
          .reverse()
          .map((goal) => {
            const player = props.value.players[goal.side as any].find(
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
                  (FIFTEEN_MINUTES_AS_MS - goal.time) / 60 / 1000
                ).toFixed(0)}{" "}
                minutes
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export function GoalForm(props: ActionFormProps<typeof schema>) {
  const { values } =
    useFormikContext<Yup.InferType<typeof actionTypes.goal.schema>>();
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
        values={([["UNKNOWN", "Unknown"]] as any).concat(
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

export const typeInfo: EventTypeInfo<typeof schema> = {
  schema,
  EditForm,
  RenderScore,
  actions: {
    goal: {
      ...actionTypes.goal,
      Form: GoalForm,
    },
    startQuarter: {
      ...actionTypes.startQuarter,
      Form: () => null as any,
    },
    pauseClock: {
      ...actionTypes.pauseClock,
      Form: () => (
        <strong className="text-warning">
          Only use this if the umpire has paused the match!
        </strong>
      ),
    },
    resumeCurrentQuarter: {
      ...actionTypes.resumeCurrentQuarter,
      Form: () => (
        <strong className="text-warning">
          Only use this if you stopped the last quarter by accident!
        </strong>
      ),
    },
    endCurrentQuarter: {
      ...actionTypes.endCurrentQuarter,
      Form: () => null as any,
    },
  },
};
