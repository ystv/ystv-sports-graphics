import { createGenericSport } from "../_generic";

const { components, typeInfo } = createGenericSport(
  "handball",
  [1],
  [30 * 60 * 1000, 5 * 60 * 1000],
  (i) => (i === 1 ? "match" : "extra time period"),
  false,
  true
);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
