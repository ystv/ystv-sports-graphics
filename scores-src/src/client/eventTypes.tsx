import { typeInfo as football } from "../common/sports/football";
import { typeInfo as netball } from "../common/sports/netball";
import { EventTypeInfo } from "../common/types";

export const EVENTS: Record<string, EventTypeInfo<any>> = {
  football,
  netball,
};
