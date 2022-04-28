import { createGenericSport } from "../_generic";

const { components, typeInfo } = createGenericSport(
  "hockey",
  [1],
  7 * 60 * 1000,
  (_) => "half"
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
