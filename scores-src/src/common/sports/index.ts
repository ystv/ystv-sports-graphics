import { Reducer } from "@reduxjs/toolkit";
import * as Yup from "yup";
import {
  Action,
  ActionPayloadValidators,
  ActionValidChecks,
} from "../eventStateHelpers";
import {
  reducer,
  schema,
  actionPayloadValidators,
  actionValidChecks,
  actions,
} from "./netball";

export interface EventTypeInfo<
  TState extends Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TActions extends Record<string, (payload?: any) => Action>
> {
  reducer: Reducer<TState>;
  schema: Yup.SchemaOf<TState>;
  actionCreators: TActions;
  actionPayloadValidators: ActionPayloadValidators<TActions>;
  actionValidChecks: ActionValidChecks<TState, TActions>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EVENT_TYPES: Record<string, EventTypeInfo<any, any>> = {
  netball: {
    reducer: reducer,
    schema: schema,
    actionCreators: actions,
    actionPayloadValidators: actionPayloadValidators,
    actionValidChecks: actionValidChecks,
  },
};
