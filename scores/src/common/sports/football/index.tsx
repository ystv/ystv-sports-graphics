import * as Yup from "yup";
import {
  ActionFormProps,
  BaseEvent,
  EventActionTypes,
  EventTypeInfo,
} from "../../types";
import {
  ArrayField,
  Field,
  RandomUUIDField,
  SelectField,
} from "../../formFields";
import type { EventActionFunctions } from "../../types";
import { useFormikContext } from "formik";
import {
  Clock,
  currentTime,
  startClock,
  stopClock,
} from "../../clock";
import { RenderClock } from "../../components/Clock";

const playerSchema = Yup.object({
  id: Yup.string().uuid().required(),
  name: Yup.string().required(),
  number: Yup.string()
    .required()
    .matches(/^[0-9]*$/, "must be a number"),
});

export const schema = BaseEvent.shape({
  scoreHome: Yup.number().default(0),
  scoreAway: Yup.number().default(0),
  players: Yup.object({
    home: Yup.array().of(playerSchema).required().default([]),
    away: Yup.array().of(playerSchema).required().default([]),
  }).required(),
  clock: Clock,
  halves: Yup.array()
    .of(
      Yup.object({
        stoppageTime: Yup.number().required().default(0),
        goals: Yup.array()
          .of(
            Yup.object({
              time: Yup.number().required(),
              side: Yup.string().oneOf(["home", "away"]).required(),
              player: Yup.string().uuid().required(),
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

type ValueType = Yup.InferType<typeof schema>;

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
        values={players.map((player) => [
          player.id,
          `${player.name} (${player.number})`,
        ])}
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

export function RenderScore(props: {
  value: ValueType;
  actions: React.ReactNode;
}) {
  const currentHalf =
    props.value.halves.length > 0
      ? props.value.halves[props.value.halves.length - 1]
      : null;
  return (
    <div>
      <h1>
        Home {props.value.scoreHome} - Away {props.value.scoreAway}
      </h1>
      <div>
        <RenderClock
          clock={props.value.clock}
          precisionMs={0}
          precisionHigh={2}
        />
        {(currentHalf?.stoppageTime || 0) > 0 && (
          <span>+{currentHalf?.stoppageTime}</span>
        )}
      </div>
      {props.actions}
      <h2>Goals</h2>
      <ul>
        {props.value.halves
          .flatMap((x) => x.goals.slice())
          .reverse()
          .map((goal) => {
            const player = props.value.players[goal.side as any].find(
              (x: Yup.InferType<typeof playerSchema>) => x.id === goal.player
            );
            return (
              <li key={goal.time}>
                {player.name} ({player.number}) at{" "}
                {/* TODO: This needs to handle stoppage time (e.g. 47th minute should show as 45+2) */}
                {Math.floor(goal.time / 60 / 1000).toFixed(0)} minutes
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export const actionTypes: EventActionTypes<typeof schema> = {
  goal: {
    schema: Yup.object({
      side: Yup.string().oneOf(["home", "away"]).required(),
      player: Yup.string().uuid().required(),
    }).required(),
    valid: (val) => val.clock.state === "running",
  },
  startHalf: {
    schema: Yup.object({}),
    valid: (val) => val.clock.state === "stopped" && val.halves.length < 2,
  },
  resumeCurrentHalf: {
    schema: Yup.object({}),
    valid: (val) => val.clock.state === "stopped" && val.halves.length > 0,
  },
  addStoppageTime: {
    schema: Yup.object({
      minutes: Yup.number().required().min(0),
    }),
    valid: (val) => val.halves.length > 0,
  },
  endHalf: {
    schema: Yup.object({}),
    valid: (val) => val.clock.state === "running",
  },
};

export const actionFuncs: EventActionFunctions<
  typeof schema,
  typeof actionTypes
> = {
  async goal(val, data) {
    if (data.side === "home") {
      val.scoreHome++;
    } else {
      val.scoreAway++;
    }
    val.halves[val.halves.length - 1].goals.push({
      side: data.side,
      player: data.player,
      time: currentTime(val.clock),
    });
  },
  async startHalf(val, data) {
    startClock(val.clock);
    val.halves.push({
      goals: [],
      stoppageTime: 0,
    });
    val.clock.timeLastStartedOrStopped = (val.halves.length - 1) * (45 * 60 * 1000);
  },
  async resumeCurrentHalf(val) {
    startClock(val.clock);
  },
  async addStoppageTime(val, data) {
    val.halves[val.halves.length - 1].stoppageTime = data.minutes;
  },
  async endHalf(val, data) {
    stopClock(val.clock);
  },
};

export const typeInfo: EventTypeInfo<typeof schema> = {
  schema,
  EditForm,
  RenderScore,
  actions: {
    goal: {
      ...actionTypes.goal,
      Form: GoalForm,
    },
    startHalf: {
      ...actionTypes.startHalf,
      Form: () => null as any,
    },
    resumeCurrentHalf: {
      ...actionTypes.resumeCurrentHalf,
      Form: () => (
        <strong className="text-warning">
          Only use this if you stopped the last half by accident!
        </strong>
      ),
    },
    addStoppageTime: {
      ...actionTypes.addStoppageTime,
      Form: () => (
        <>
          <Field name="minutes" title="Minutes" type="number" />
        </>
      ),
    },
    endHalf: {
      ...actionTypes.endHalf,
      Form: () => null as any,
    },
  },
};
