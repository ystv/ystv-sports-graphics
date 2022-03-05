import * as Yup from "yup";
import { ActionFormProps, BaseEvent, EventActionTypes, EventTypeInfo } from "../../types";
import {
  ArrayField,
  Field,
  RandomUUIDField,
  SelectField,
} from "../../formFields";
import type { EventActionFunctions } from "../../types";
import { useFormikContext } from "formik";
import { Clock, currentTime, RenderClock, startClock } from "../../clock";

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
  goals: Yup.array().of(Yup.object({
    time: Yup.number().required(),
    side: Yup.string().oneOf(["home", "away"]).required(),
    player: Yup.string().uuid().required()
  })).required().default([])
});

type ValueType = Yup.InferType<typeof schema>;

export function GoalForm(props: ActionFormProps<typeof schema>) {
  const { values } = useFormikContext<Yup.InferType<typeof actionTypes.goal.schema>>();
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
  actions: JSX.Element[];
}) {
  return (
    <div>
      <h1>
        Home {props.value.scoreHome} - Away {props.value.scoreAway}
      </h1>
      <div>
        <RenderClock clock={props.value.clock} precisionMs={0} precisionHigh={2} />
      </div>
      {props.actions}
      <h2>Goals</h2>
      <ul>
        {props.value.goals?.sort((a, b) => b.time - a.time).map((goal) => {
          const player = props.value.players[goal.side].find(x => x.id === goal.player);
          return (
            (
              <li key={goal.time}>{player.name} ({player.number}) at {(goal.time / 60 / 1000).toFixed(0)} minutes</li>
            )
          )
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
    valid: val => val.clock.state === "running"
  },
  startHalf: {
    schema: Yup.object({}),
    valid: val => val.clock.state === "stopped"
  }
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
    val.goals.push({
      side: data.side,
      player: data.player,
      time: currentTime(val.clock)
    });
  },
  async startHalf(val, data) {
    startClock(val.clock);
  }
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
      Form: () => null
    }
  },
};
