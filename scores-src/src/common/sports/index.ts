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
import {
  typeInfo as badmintonTypeInfo,
  components as badmintonComponents,
} from "./badminton";
import {
  typeInfo as canoePoloTypeInfo,
  components as canoePoloComponents,
} from "./canoePolo";
import {
  typeInfo as tableTennisTypeInfo,
  components as tableTennisComponents,
} from "./tableTennis";
import {
  typeInfo as futsalTypeInfo,
  components as futsalComponents,
} from "./futsal";
import {
  typeInfo as hockeyTypeInfo,
  components as hockeyComponents,
} from "./hockey";
import {
  typeInfo as swimmingTypeInfo,
  components as swimmingComponents,
} from "./swimming";
import {
  typeInfo as korfballTypeInfo,
  components as korfballComponents,
} from "./korfball";
import { EventComponents, EventTypeInfo } from "../types";

export const EVENT_TYPES: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EventTypeInfo<any, { [K: string]: (payload?: any) => { type: string } }>
> = {
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
  badminton: badmintonTypeInfo,
  canoePolo: canoePoloTypeInfo,
  tableTennis: tableTennisTypeInfo,
  futsal: futsalTypeInfo,
  hockey: hockeyTypeInfo,
  swimming: swimmingTypeInfo,
  korfball: korfballTypeInfo,
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
  badminton: badmintonComponents,
  canoePolo: canoePoloComponents,
  tableTennis: tableTennisComponents,
  futsal: futsalComponents,
  hockey: hockeyComponents,
  swimming: swimmingComponents,
  korfball: korfballComponents,
};
