import { createAction } from "@reduxjs/toolkit";
import { merge } from "lodash-es";
import * as Yup from "yup";

export interface ActionMeta {
  ts: number;
  undo?: true;
}

export interface Action<TPayload = Record<string, unknown>> {
  type: string;
  payload: TPayload;
  meta: ActionMeta;
}

export type Reducer<TState> = (state: TState, action: Action) => TState;

export type ActionPayloadValidators<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TActions extends { [K: string]: (payload: any) => any }
> = {
  [K in keyof TActions]: Parameters<TActions[K]>[0] extends Record<
    string,
    unknown
  >
    ? Yup.SchemaOf<Parameters<TActions[K]>[0]>
    : Yup.AnySchema;
};

export type ActionValidChecks<
  TState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TActions extends { [K: string]: (payload: any) => any }
> = {
  [K in keyof TActions]?: (state: TState) => boolean;
};

export const Init = createAction<Record<string, unknown>>("@@init");
export const Edit = createAction<Record<string, unknown>>("@@edit");

export function wrapReducer<TState>(reducer: Reducer<TState>): Reducer<TState> {
  return (state, action) => {
    if (Init.match(action as any)) {
      return action.payload as TState;
    }
    if (Edit.match(action as any)) {
      return merge(state, action.payload);
    }
    return reducer(state, action);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapAction(action: Record<string, never>): any;
export function wrapAction<
  TPayload extends Record<string, unknown>,
  TAction extends { payload: TPayload }
>(
  action: TAction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any;
export function wrapAction<TAction extends Action>(action: TAction): TAction {
  return {
    ...action,
    meta: {
      ...(action.meta || {}),
      ts: new Date().valueOf(),
    },
  };
}

export function resolveEventState<TState>(
  reducer: Reducer<TState>,
  actions: Action[]
): TState {
  return actions
    .filter((x) => !x.meta?.undo)
    .reduce(wrapReducer(reducer), {} as TState);
}
