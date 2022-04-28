import * as Yup from "yup";
import { TypedSchema } from "yup/lib/util/types";

// @ts-expect-error can't type index signature
export const BaseEvent: Yup.SchemaOf<BaseEventType> = Yup.object().shape({
  id: Yup.string().uuid().required(),
  type: Yup.string().required(),
  startTime: Yup.string()
    .required()
    .default(() => new Date().toISOString()),
  name: Yup.string().required(),
  notCovered: Yup.boolean().default(false),
  rosesLiveID: Yup.number().optional(),
  winner: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).notRequired(),
  worthPoints: Yup.number().integer().required().min(0),
});

export interface BaseEventType {
  id: string;
  type: string;
  name: string;
  startTime: string;
  notCovered?: boolean;
  rosesLiveID?: number;
  winner?: "home" | "away";
  worthPoints: number;
  [K: string]: unknown;
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
  hiddenActions?: Set<keyof TActions>;
}

export interface EventComponents<
  TActions extends { [K: string]: (payload?: any) => { type: string } },
  TState
> {
  EditForm: () => JSX.Element;
  RenderScore: (props: {
    state: TState;
    act: <K extends keyof TActions>(
      type: K,
      payload: TActions[K] extends { prepare: (payload: any) => any }
        ? Parameters<TActions[K]["prepare"]>[0]
        : Parameters<TActions[K]>[0]
    ) => Promise<void>;
  }) => JSX.Element;
  actionForms: {
    [K in keyof TActions]?: (props: { currentState: any }) => JSX.Element;
  };
}
