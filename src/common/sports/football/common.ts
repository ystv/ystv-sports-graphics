import * as Yup from "yup";
import { BaseEvent } from "../../types";

export const schema = BaseEvent.shape({
    id: Yup.string().required(),
    type: Yup.string().required(),
    scoreHome: Yup.number().required(),
    scoreAway: Yup.number().required()
});

export const actionTypes = {
    goal: Yup.object({
        side: Yup.string().oneOf(["home", "away"]).required()
    }).required()
};
