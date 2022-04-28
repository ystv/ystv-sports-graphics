import { createGenericSport } from "../_generic";

const TEN_MINUTES = 10 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const MAX_QUARTERS_WITHOUT_OVERTIME = 4;

const { components, typeInfo } = createGenericSport(
  "basketball",
  [1, 2, 3],
  [TEN_MINUTES, TEN_MINUTES, TEN_MINUTES, TEN_MINUTES, FIVE_MINUTES],
  (n) => (n <= MAX_QUARTERS_WITHOUT_OVERTIME ? "quarter" : "overtime"),
  false,
  true
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
