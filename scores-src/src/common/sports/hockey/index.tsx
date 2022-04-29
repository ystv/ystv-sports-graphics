import { createGenericSport } from "../_generic";

const { components, typeInfo } = createGenericSport(
  "hockey",
  [1],
  10 * 60 * 1000,
  (_) => "quarters"
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
