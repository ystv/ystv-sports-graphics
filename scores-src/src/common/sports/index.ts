import { Reducer } from "@reduxjs/toolkit";
import React from "react";
import * as Yup from "yup";
import {
  Action,
  ActionPayloadValidators,
  ActionValidChecks,
} from "../eventStateHelpers";
import {
  reducer as netballReducer,
  schema as netballSchema,
  actionPayloadValidators as netballActionPayloadValidators,
  actionValidChecks as netballActionValidChecks,
  actionRenderers as netballActionRenderers,
  actions as netballActions,
  RenderScore as NetballRenderScore,
  GoalForm as NetballGoalForm,
  EditForm as NetballEditForm,
} from "./netball";
import {
  reducer as footballReducer,
  schema as footballSchema,
  actionPayloadValidators as footballActionPayloadValidators,
  actionValidChecks as footballActionValidChecks,
  actionRenderers as footballActionRenderers,
  actions as footballActions,
  RenderScore as FootballRenderScore,
  GoalForm as FootballGoalForm,
  EditForm as FootballEditForm,
  StoppageTimeForm as FootballStoppageTimeForm,
} from "./football";
import { ActionRenderers } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface EventTypeInfo<
  TState extends Record<string, unknown>,
  TActions extends Record<string, (payload?: any) => Action>
> {
  reducer: Reducer<TState>;
  schema: Yup.SchemaOf<TState> & Yup.AnyObjectSchema;
  actionCreators: TActions;
  actionPayloadValidators: ActionPayloadValidators<TActions>;
  actionValidChecks: ActionValidChecks<TState, TActions>;
  actionRenderers: ActionRenderers<TActions, any, TState>;
}
interface EventComponents {
  EditForm: () => React.ReactNode;
  RenderScore: (props: { state: any }) => React.ReactNode;
  actionForms: Record<
    string,
    (props: { currentState: any }) => React.ReactNode
  >;
}

export const EVENT_TYPES: Record<string, EventTypeInfo<any, any>> = {
  netball: {
    reducer: netballReducer,
    schema: netballSchema,
    actionCreators: netballActions,
    actionPayloadValidators: netballActionPayloadValidators,
    actionValidChecks: netballActionValidChecks,
    actionRenderers: netballActionRenderers,
  },
  football: {
    reducer: footballReducer,
    schema: footballSchema,
    actionCreators: footballActions,
    actionPayloadValidators: footballActionPayloadValidators,
    actionValidChecks: footballActionValidChecks,
    actionRenderers: footballActionRenderers,
  },
};

/* eslint-enable @typescript-eslint/no-explicit-any */

export const EVENT_COMPONENTS: Record<string, EventComponents> = {
  netball: {
    EditForm: NetballEditForm,
    RenderScore: NetballRenderScore,
    actionForms: {
      goal: NetballGoalForm,
    },
  },
  football: {
    EditForm: FootballEditForm,
    RenderScore: FootballRenderScore,
    actionForms: {
      goal: FootballGoalForm,
      addStoppageTime: FootballStoppageTimeForm,
    },
  },
};
