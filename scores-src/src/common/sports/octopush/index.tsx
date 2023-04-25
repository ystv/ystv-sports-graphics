import { createGenericSport } from "../_generic";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const { components, typeInfo } = createGenericSport(
  "octopush",
  [1],
  FIFTEEN_MINUTES,
  (_) => "half",
  false,
  true
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
