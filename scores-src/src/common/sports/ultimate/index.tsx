import { createGenericSport } from "../_generic";

const { components, typeInfo } = createGenericSport(
  "ultimate",
  [1],
  undefined,
  undefined,
  true,
  false
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
