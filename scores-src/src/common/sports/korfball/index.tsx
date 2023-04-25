import { createGenericSport } from "../_generic";

const THIRTY_MINUTES = 30 * 60 * 1000;

const { components, typeInfo } = createGenericSport(
  "korfball",
  [1],
  THIRTY_MINUTES,
  (_) => "half",
  false,
  true
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
