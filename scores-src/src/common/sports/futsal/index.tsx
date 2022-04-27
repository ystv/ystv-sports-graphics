import { createGenericSport } from "../_generic";

const TWENTY_MINUTES = 20 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const NUM_HALVES_BEFORE_EXTRA_TIME = 4;

const { components, typeInfo } = createGenericSport(
  "futsal",
  [1],
  [TWENTY_MINUTES, TWENTY_MINUTES, FIVE_MINUTES],
  (n) => (n <= NUM_HALVES_BEFORE_EXTRA_TIME ? "half" : "extra time period"),
  true
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
