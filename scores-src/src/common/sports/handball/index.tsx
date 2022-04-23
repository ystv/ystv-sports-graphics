import { createGenericSport } from "../_generic";

const { components, typeInfo } = createGenericSport(
  "handball",
  [1],
  [25 * 60 * 1000, 5 * 60 * 1000],
  (i) => (i === 1 ? "match" : "extra time period")
);

export { components, typeInfo };
