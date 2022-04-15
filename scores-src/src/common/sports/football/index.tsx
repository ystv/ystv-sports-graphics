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
  SegmentedSelectField,
  SelectField,
} from "../../formFields";
import type { EventActionFunctions } from "../../types";
import { useFormikContext } from "formik";
import { currentTime, startClock, stopClock, UpwardClock } from "../../clock";
import { RenderClock } from "../../components/Clock";
import { Mark, Stack, Title, Text, Table, Button } from "@mantine/core";
import Pencil from "tabler-icons-react/dist/icons/pencil";
import { ReactNode } from "react";

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
  clock: UpwardClock,
  halves: Yup.array()
    .of(
      Yup.object({
        stoppageTime: Yup.number().required().default(0),
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
              <Field name={namespace + "number"} title="Number" independent />
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
              <Field name={namespace + "number"} title="Number" independent />
            </div>
          )}
        />
      </fieldset>
    </>
  );
}

export function RenderScore(props: { value: ValueType; actions: ReactNode }) {
  const currentHalf =
    props.value.halves.length > 0
      ? props.value.halves[props.value.halves.length - 1]
      : null;
  return (
    <Stack align={"center"}>
      <Title>
        Home {props.value.scoreHome} - Away {props.value.scoreAway}
      </Title>
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
      <Title order={3}>Events</Title>
      <Table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Event</th>
            <th>Player</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {props.value.halves
            .flatMap((x) => x.goals.slice())
            .reverse()
            .map((goal) => {
              // @ts-expect-error something is funky with the indexing here
              const player = props.value.players[goal.side].find(
                (x: Yup.InferType<typeof playerSchema>) => x.id === goal.player
              ) as
                | ValueType["players"]["home"][0]
                | ValueType["players"]["away"][0];
              return (
                <tr key={goal.time}>
                  <td>{Math.floor(goal.time / 60 / 1000).toFixed(0)}&apos;</td>
                  <td>GOAL</td>
                  <td>
                    {player.name} ({player.number})
                  </td>
                  <td>
                    <Button disabled leftIcon={<Pencil />}>
                      Edit
                    </Button>
                  </td>
                  {/* TODO: This needs to handle stoppage time (e.g. 47th minute should show as 45+2) */}
                </tr>
              );
            })}
        </tbody>
      </Table>
    </Stack>
  );
}

export const actionTypes: EventActionTypes<typeof schema> = {
  goal: {
    schema: Yup.object({
      side: Yup.string().oneOf(["home", "away"]).required(),
      player: Yup.string().uuid().required().nullable().default(null),
    }).required(),
    valid: (val) => val.clock.state === "running",
  },
  startHalf: {
    schema: Yup.object({}),
    // TODO what about extra time?
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
    val.clock.timeLastStartedOrStopped =
      (val.halves.length - 1) * (45 * 60 * 1000);
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
      // @ts-expect-error should be ReactNode
      Form: () => null,
    },
    resumeCurrentHalf: {
      ...actionTypes.resumeCurrentHalf,
      Form: () => (
        <Text weight={900}>
          <Mark color={"red"}>
            Only use this if you stopped the last half by accident!
          </Mark>
        </Text>
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
      // @ts-expect-error should be ReactNode
      Form: () => null,
    },
  },
};
