import * as Yup from "yup";
import { TypedSchema } from "yup/lib/util/types";

export const BaseEvent: Yup.SchemaOf<BaseEventType> = Yup.object().shape({
  id: Yup.string().uuid().required(),
  type: Yup.string().required(),
  name: Yup.string().required(),
  notCovered: Yup.boolean().default(false),
  winner: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).notRequired(),
  worthPoints: Yup.number().integer().required().min(0),
});

export interface BaseEventType {
  id: string;
  type: string;
  name: string;
  notCovered?: boolean;
  winner?: "home" | "away";
  worthPoints: number;
}

export interface ActionMeta {
  ts: number;
  undone?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Action<TPayload = any> {
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

export interface ActionFormProps<TState> {
  currentState: TState;
}

export type Permission = "SUDO" | "read" | "write" | "admin";

export interface User {
  username: string;
  passwordHash?: string;
  permissions: Permission[];
}

export type ActionRenderers<
  TActions,
  TCaseReducers extends Record<
    keyof TActions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: TState, action: any) => unknown
  >,
  TState
> = {
  [K in keyof TActions]: (props: {
    action: Parameters<TCaseReducers[K]>[1];
    state: TState;
  }) => JSX.Element;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface EventTypeInfo<
  TState,
  TActions extends { [K: string]: (payload?: any) => { type: string } }
> {
  reducer: Reducer<TState>;
  schema: Yup.SchemaOf<TState> & Yup.AnyObjectSchema;
  actionCreators: TActions;
  actionPayloadValidators: ActionPayloadValidators<TActions>;
  actionValidChecks: ActionValidChecks<TState, TActions>;
  actionRenderers: ActionRenderers<TActions, any, TState>;
}

export interface EventComponents<TActions> {
  EditForm: () => JSX.Element;
  RenderScore: (props: { state: any }) => JSX.Element;
  actionForms: {
    [K in keyof TActions]?: (props: { currentState: any }) => JSX.Element;
  };
}
