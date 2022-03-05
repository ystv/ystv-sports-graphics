import * as Yup from "yup";
import { BaseEvent } from "../../types";
import { Field } from "../../formFields";
import type { EventActionFunctions } from "../../types";

export const schema = BaseEvent.shape({
    scoreHome: Yup.number().default(0),
    scoreAway: Yup.number().default(0),
});

export const actionTypes = {
    goal: Yup.object({
        side: Yup.string().oneOf(["home", "away"]).required()
    }).required()
};

export function EditForm() {
    return (
        <div>
            <Field name="name" title="Name" />
        </div>
    )
}

export function RenderScore(props: { value: Yup.InferType<typeof schema>, actions: JSX.Element }) {
    return (
        <div>
            <h1>Home {props.value.scoreHome} - Away {props.value.scoreAway}</h1>
            {props.actions}
        </div>
    )
}

export const actionFuncs: EventActionFunctions<typeof schema, typeof actionTypes> = {
    async goal(val, data) {
        if (data.side === "home") {
            val.scoreHome++;
        } else {
            val.scoreAway++;
        }
    }
};
