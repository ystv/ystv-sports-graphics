import * as Yup from "yup";

export interface TeamInfo {
  slug: string;
  name: string;
  abbreviation: string;
  primaryColour: string;
  secondaryColour: string;
  crestAttachmentID: string;
}

export const TeamInfoSchema: Yup.SchemaOf<TeamInfo> = Yup.object({
  slug: Yup.string().required(),
  name: Yup.string().required(),
  abbreviation: Yup.string().required().min(3).max(4),
  primaryColour: Yup.string()
    .required()
    .matches(/^#[0-9a-f]{6}$/i),
  secondaryColour: Yup.string()
    .required()
    .matches(/^#[0-9a-f]{6}$/i),
  crestAttachmentID: Yup.string().required().uuid(),
});

// @ts-expect-error can't type index signature
export const EventMetaSchema: Yup.SchemaOf<EventMeta> = Yup.object().shape({
  id: Yup.string().uuid().required(),
  league: Yup.string().required(),
  type: Yup.string().required(),
  startTime: Yup.string()
    .required()
    .default(() => new Date().toISOString()),
  name: Yup.string().required(),
  notCovered: Yup.boolean().default(false),
  rosesLiveID: Yup.number().optional(),
  winner: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).notRequired(),
  worthPoints: Yup.number().integer().required().min(0),
  homeTeam: TeamInfoSchema,
  awayTeam: TeamInfoSchema,
});

/**
 * Identical to EventMetaSchema except omitting league, type, and id, and replacing the team info objects with slugs.
 */
export const EventCreateEditSchema: Yup.SchemaOf<EventMeta> =
  EventMetaSchema.omit(["league", "type", "id"]).shape({
    homeTeam: Yup.string()
      .required()
      .transform((val, original, context) => {
        if (context.isType(val)) {
          return val;
        }
        if (typeof original === "object" && "slug" in original) {
          return original.slug;
        }
        return val;
      }),
    awayTeam: Yup.string()
      .required()
      .transform((val, original, context) => {
        if (context.isType(val)) {
          return val;
        }
        if (typeof original === "object" && "slug" in original) {
          return original.slug;
        }
        return val;
      }),
  });

export interface EventMeta {
  id: string;
  league: string; // league slug
  type: string;
  name: string;
  startTime: string;
  notCovered?: boolean;
  rosesLiveID?: number;
  winner?: "home" | "away";
  worthPoints: number;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  [K: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type BaseEventStateType = {};

export interface League {
  slug?: string;
  name: string;
  startDate: string;
  endDate: string;
}

export const LeagueSchema: Yup.SchemaOf<League> = Yup.object({
  slug: Yup.string().optional(),
  name: Yup.string().required(),
  startDate: Yup.string().required(),
  endDate: Yup.string().required(),
});

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
  meta: EventMeta;
}

export type Permission = "SUDO" | "read" | "write" | "admin" | "dangerZone";

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
    meta: EventMeta;
  }) => JSX.Element;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface EventTypeInfo<
  TState,
  TActions extends { [K: string]: (payload?: any) => { type: string } }
> {
  reducer: Reducer<TState>;
  stateSchema: Yup.SchemaOf<TState> & Yup.AnyObjectSchema;
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
  EditForm: (props: { meta: EventMeta }) => JSX.Element;
  RenderScore: (props: {
    state: TState;
    meta: EventMeta;
    act: <K extends keyof TActions>(
      type: K,
      payload: TActions[K] extends { prepare: (payload: any) => any }
        ? Parameters<TActions[K]["prepare"]>[0]
        : Parameters<TActions[K]>[0]
    ) => Promise<void>;
    showActModal: <K extends keyof TActions>(
      type: K,
      initialState: TActions[K] extends { prepare: (payload: any) => any }
        ? Parameters<TActions[K]["prepare"]>[0]
        : Parameters<TActions[K]>[0]
    ) => void;
  }) => JSX.Element;
  actionForms: {
    [K in keyof TActions]?: (props: {
      currentState: TState;
      meta: EventMeta;
    }) => JSX.Element;
  };
}
