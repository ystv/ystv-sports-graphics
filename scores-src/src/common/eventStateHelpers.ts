import { createAction } from "@reduxjs/toolkit";
import { Action, Reducer } from "./types";

export const Init = createAction<Record<string, unknown>>("@@init");
export const Edit = createAction<Record<string, unknown>>("@@edit");
export const Undo = createAction<{ ts: number }>("@@undo");
export const Redo = createAction<{ ts: number }>("@@redo");

export function wrapReducer<TState>(reducer: Reducer<TState>): Reducer<TState> {
  return (state, action) => {
    if (action.meta.undone) {
      return state;
    }
    if (Init.match(action as any)) {
      return action.payload as TState;
    }
    if (Edit.match(action as any)) {
      return { ...state, ...action.payload };
    }
    return reducer(state, action);
  };
}

export function wrapAction<
  TPayload extends Record<string, unknown>,
  TAction extends { payload: TPayload }
>(action: TAction): Action<TPayload>;
export function wrapAction<TAction extends Action>(action: TAction): TAction {
  return {
    ...action,
    meta: {
      ...(action.meta || {}),
      ts: new Date().valueOf(),
    },
  };
}

export function findUndoneActions(history: Action[]) {
  const undone = new Set<number>();
  history.forEach((action) => {
    if (Undo.match(action)) {
      undone.add(action.payload.ts);
    } else if (Redo.match(action)) {
      undone.delete(action.payload.ts);
    }
  });
  return undone;
}

export function resolveEventState<TState>(
  reducer: Reducer<TState>,
  actions: Action[]
): TState {
  const undone = findUndoneActions(actions);
  return actions
    .map((action) => {
      if (undone.has(action.meta.ts)) {
        return {
          ...action,
          meta: {
            ...action.meta,
            undone: true,
          },
        };
      } else if (action.meta.undone) {
        delete action.meta.undone;
      }
      return action;
    })
    .reduce(wrapReducer(reducer), {} as TState);
}
