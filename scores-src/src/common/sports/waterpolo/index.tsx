import { createGenericSport } from "../_generic";

const { components, typeInfo } = createGenericSport(
  "waterpolo",
  [1],
  8 * 60 * 1000,
  (_) => "quarter",
  false,
  true
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
