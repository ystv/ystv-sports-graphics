import { createGenericSport } from "../_generic";

const { components, typeInfo } = createGenericSport(
  "waterpolo",
  [1],
  7 * 60 * 1000,
  (_) => "quarter"
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
