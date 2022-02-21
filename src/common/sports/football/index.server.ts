import { actionTypes, schema } from "./common";
import type { EventActionFunctions } from "../../types";

export * from "./common";

export const actionFuncs: EventActionFunctions<typeof schema, typeof actionTypes> = {
    async goal(val, data) {
        if (data.side === "home") {
            val.scoreHome++;
        } else {
            val.scoreAway++;
        }
    }
};
