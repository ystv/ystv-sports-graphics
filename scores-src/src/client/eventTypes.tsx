import { typeInfo as football } from "../common/sports/football";
import { typeInfo as netball } from "../common/sports/netball";
import { EventTypeInfo } from "../common/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EVENTS: Record<string, EventTypeInfo<any>> = {
  football,
  netball,
};
