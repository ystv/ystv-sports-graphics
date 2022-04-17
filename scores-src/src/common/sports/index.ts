import {
  typeInfo as netballTypeInfo,
  components as netballComponents,
} from "./netball";
import {
  typeInfo as footballTypeInfo,
  components as footballComponents,
} from "./football";
import { EventComponents, EventTypeInfo } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EVENT_TYPES: Record<string, EventTypeInfo<any, any>> = {
  netball: netballTypeInfo,
  football: footballTypeInfo,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EVENT_COMPONENTS: Record<string, EventComponents<any>> = {
  netball: netballComponents,
  football: footballComponents,
};
