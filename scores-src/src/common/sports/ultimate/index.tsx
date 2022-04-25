import { createGenericSport } from "../_generic";

const { components, typeInfo } = createGenericSport("ultimate", [1]);

export type State = ReturnType<typeof typeInfo["reducer"]>;

export { components, typeInfo };
