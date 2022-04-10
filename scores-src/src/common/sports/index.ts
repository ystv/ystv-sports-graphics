import {
  typeInfo as netballTypeInfo,
  components as netballComponents,
} from "./netball";
import {
  typeInfo as footballTypeInfo,
  components as footballComponents,
} from "./football";
import {
  typeInfo as basketballTypeInfo,
  components as basketballComponents,
} from "./basketball";
import {
  typeInfo as handballTypeInfo,
  components as handballComponents,
} from "./handball";
import {
  typeInfo as lacrosseTypeInfo,
  components as lacrosseComponents,
} from "./lacrosse";
import {
  typeInfo as ultimateTypeInfo,
  components as ultimateComponents,
} from "./ultimate";
import {
  typeInfo as waterpoloTypeInfo,
  components as waterpoloComponents,
} from "./waterpolo";
import {
  typeInfo as volleyballTypeInfo,
  components as volleyballComponents,
} from "./volleyball";
import {
  typeInfo as americanFootballTypeInfo,
  components as americanFootballComponents,
} from "./americanFootball";
import {
  typeInfo as rugbyUnionTypeInfo,
  components as rugbyUnionComponents,
} from "./rugbyUnion";
import { EventComponents, EventTypeInfo } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EVENT_TYPES: Record<string, EventTypeInfo<any, any>> = {
  netball: netballTypeInfo,
  football: footballTypeInfo,
  basketball: basketballTypeInfo,
  handball: handballTypeInfo,
  lacrosse: lacrosseTypeInfo,
  ultimate: ultimateTypeInfo,
  waterpolo: waterpoloTypeInfo,
  volleyball: volleyballTypeInfo,
  americanFootball: americanFootballTypeInfo,
  rugbyUnion: rugbyUnionTypeInfo,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EVENT_COMPONENTS: Record<string, EventComponents<any, any>> = {
  netball: netballComponents,
  football: footballComponents,
  basketball: basketballComponents,
  handball: handballComponents,
  lacrosse: lacrosseComponents,
  ultimate: ultimateComponents,
  waterpolo: waterpoloComponents,
  volleyball: volleyballComponents,
  americanFootball: americanFootballComponents,
  rugbyUnion: rugbyUnionComponents,
};
