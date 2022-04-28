import { type } from "os";
import { createGenericSport } from "../_generic";

const HALF_DURATION = 10 * 60 * 1000; // 10 mins
const OVERTIME_DURATION = 5 * 60 * 1000; // 5 mins

const { components, typeInfo } = createGenericSport(
  "canoePolo",
  [1],
  [HALF_DURATION, HALF_DURATION, OVERTIME_DURATION],
  (i) => (i === 1 ? "match" : "overtime period")
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
