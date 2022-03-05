import * as Yup from "yup";
import { BaseEvent, EventTypeInfo } from "../../types";
import { Field, SelectField } from "../../formFields";
import type { EventActionFunctions } from "../../types";
import { cloneElement } from "react";

export const schema = BaseEvent.shape({
  scoreHome: Yup.number().default(0),
  scoreAway: Yup.number().default(0),
});

type ValueType = Yup.InferType<typeof schema>;

export const actionTypes = {
  goal: Yup.object({
    side: Yup.string().oneOf(["home", "away"]).required(),
  }).required(),
};

export function GoalForm() {
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
    </div>
  );
}

export function EditForm() {
  return (
    <div>
      <Field name="name" title="Name" />
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
      {props.actions}
    </div>
  );
}

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
  },
};

export const typeInfo: EventTypeInfo<typeof schema> = {
  schema: schema,
  EditForm,
  RenderScore,
  actions: {
    goal: {
      schema: actionTypes.goal,
      Form: GoalForm,
    },
  },
};
