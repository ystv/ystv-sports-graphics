import { createGenericSport } from "../_generic";

const TWELVE_MINUTES = 12 * 60 * 1000;

const { components, typeInfo } = createGenericSport(
  "americanFootball",
  [1, 2, 3, 6],
  [
    TWELVE_MINUTES,
    TWELVE_MINUTES,
    TWELVE_MINUTES,
    TWELVE_MINUTES,
    10 * 60 * 1000,
  ],
  (i) => (i <= 4 ? "quarter" : "extra time period"),
  true,
  true
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
