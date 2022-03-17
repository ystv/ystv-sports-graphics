import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Colour: any;
  Duration: any;
  Time: any;
};

export type CreateEventInput = {
  time: Scalars['Time'];
  title: Scalars['String'];
  type: EventType;
  venue: Scalars['String'];
};

export type Event = {
  id: Scalars['ID'];
  time: Scalars['Time'];
  title: Scalars['String'];
  type: EventType;
  venue: Scalars['String'];
};

export enum EventType {
  Football = 'football',
  RugbyUnion = 'rugbyUnion'
}

export type FootballEditInput = {
  awayTeam?: Maybe<GenericTeamInput>;
  homeTeam?: Maybe<GenericTeamInput>;
  id: Scalars['ID'];
  leagueName?: Maybe<Scalars['String']>;
  leagueTable?: Maybe<Array<FootballLeagueTableEntryInput>>;
  time?: Maybe<Scalars['Time']>;
  title?: Maybe<Scalars['String']>;
  venue?: Maybe<Scalars['String']>;
};

export type FootballEvent = Event & {
  __typename?: 'FootballEvent';
  awayTeam: Team;
  halves: Array<FootballHalf>;
  homeTeam: Team;
  id: Scalars['ID'];
  leagueName: Scalars['String'];
  leagueTable?: Maybe<Array<FootballLeagueTableEntry>>;
  time: Scalars['Time'];
  title: Scalars['String'];
  totalScore: FootballScore;
  type: EventType;
  venue: Scalars['String'];
};

export type FootballHalf = {
  __typename?: 'FootballHalf';
  addedTime: Scalars['Duration'];
  keyEvents: Array<FootballKeyEvent>;
  score: FootballScore;
  timer: Timer;
};

export type FootballKeyEvent = {
  __typename?: 'FootballKeyEvent';
  incomingPlayer?: Maybe<Scalars['ID']>;
  player: Scalars['ID'];
  team: TeamSide;
  time: Scalars['Duration'];
  type?: Maybe<FootballKeyEventType>;
};

export enum FootballKeyEventType {
  Goal = 'goal',
  RedCard = 'redCard',
  Substitution = 'substitution',
  YellowCard = 'yellowCard'
}

export type FootballLeagueTableEntry = {
  __typename?: 'FootballLeagueTableEntry';
  against: Scalars['Int'];
  difference: Scalars['Int'];
  drawn: Scalars['Int'];
  for: Scalars['Int'];
  lost: Scalars['Int'];
  played: Scalars['Int'];
  points: Scalars['Int'];
  team: Scalars['String'];
  won: Scalars['Int'];
};

export type FootballLeagueTableEntryInput = {
  against: Scalars['Int'];
  difference: Scalars['Int'];
  drawn: Scalars['Int'];
  for: Scalars['Int'];
  lost: Scalars['Int'];
  played: Scalars['Int'];
  points: Scalars['Int'];
  team: Scalars['String'];
  won: Scalars['Int'];
};

export type FootballScore = {
  __typename?: 'FootballScore';
  away: Scalars['Int'];
  home: Scalars['Int'];
};

export type GenericPlayerInput = {
  designation?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
  name: Scalars['String'];
  role?: Maybe<Scalars['String']>;
};

export type GenericTeam = Team & {
  __typename?: 'GenericTeam';
  abbreviation: Scalars['String'];
  colourPrimary: Scalars['Colour'];
  colourSecondary: Scalars['Colour'];
  id: Scalars['String'];
  name: Scalars['String'];
  players: Array<GenericTeamPlayer>;
};

export type GenericTeamInput = {
  abbreviation: Scalars['String'];
  colourPrimary: Scalars['Colour'];
  colourSecondary: Scalars['Colour'];
  name: Scalars['String'];
  players?: Maybe<Array<GenericPlayerInput>>;
};

export type GenericTeamPlayer = TeamPlayer & {
  __typename?: 'GenericTeamPlayer';
  designation?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  role?: Maybe<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  FootballAction?: Maybe<FootballEvent>;
  FootballAddTime?: Maybe<FootballEvent>;
  FootballChangeHalf?: Maybe<FootballEvent>;
  FootballEditEvent?: Maybe<FootballEvent>;
  FootballSubstitution?: Maybe<FootballEvent>;
  FootballTimerState?: Maybe<FootballEvent>;
  createEvent?: Maybe<Event>;
  rugbyUnionAction?: Maybe<RugbyUnionEvent>;
  rugbyUnionEditEvent?: Maybe<RugbyUnionEvent>;
  rugbyUnionTimerState?: Maybe<RugbyUnionEvent>;
  signIn: SignInResult;
};


export type MutationFootballActionArgs = {
  event: Scalars['ID'];
  player: Scalars['ID'];
  team: TeamSide;
  type: FootballKeyEventType;
};


export type MutationFootballAddTimeArgs = {
  addedTime: Scalars['Duration'];
  event: Scalars['ID'];
};


export type MutationFootballChangeHalfArgs = {
  event: Scalars['ID'];
};


export type MutationFootballEditEventArgs = {
  input: FootballEditInput;
};


export type MutationFootballSubstitutionArgs = {
  event: Scalars['ID'];
  incomingPlayer: Scalars['ID'];
  player: Scalars['ID'];
  team: TeamSide;
};


export type MutationFootballTimerStateArgs = {
  event: Scalars['ID'];
  state: TimerState;
};


export type MutationCreateEventArgs = {
  input: CreateEventInput;
};


export type MutationRugbyUnionActionArgs = {
  event: Scalars['ID'];
  player: Scalars['ID'];
  team: TeamSide;
  type: RugbyUnionKeyEventType;
};


export type MutationRugbyUnionEditEventArgs = {
  input: RugbyUnionEditInput;
};


export type MutationRugbyUnionTimerStateArgs = {
  event: Scalars['ID'];
  state: TimerState;
};


export type MutationSignInArgs = {
  input: SignInInput;
};

export enum Permission {
  Admin = 'admin'
}

export type Query = {
  __typename?: 'Query';
  allEvents?: Maybe<Array<Event>>;
  eventById?: Maybe<Event>;
  futureEvents?: Maybe<Array<Event>>;
  me?: Maybe<User>;
};


export type QueryEventByIdArgs = {
  id: Scalars['ID'];
};

export type RugbyUnionEditInput = {
  awayTeam?: Maybe<GenericTeamInput>;
  homeTeam?: Maybe<GenericTeamInput>;
  id: Scalars['ID'];
  leagueName?: Maybe<Scalars['String']>;
  leagueTable?: Maybe<Array<RugbyUnionLeagueTableEntryInput>>;
  time?: Maybe<Scalars['Time']>;
  title?: Maybe<Scalars['String']>;
  venue?: Maybe<Scalars['String']>;
};

export type RugbyUnionEvent = Event & {
  __typename?: 'RugbyUnionEvent';
  awayTeam: Team;
  halves: Array<RugbyUnionHalf>;
  homeTeam: Team;
  id: Scalars['ID'];
  leagueName: Scalars['String'];
  leagueTable?: Maybe<Array<RugbyUnionLeagueTableEntry>>;
  time: Scalars['Time'];
  title: Scalars['String'];
  totalScore: RugbyUnionScore;
  type: EventType;
  venue: Scalars['String'];
};

export type RugbyUnionHalf = {
  __typename?: 'RugbyUnionHalf';
  keyEvents: Array<RugbyUnionKeyEvent>;
  score: RugbyUnionScore;
  timer: Timer;
};

export type RugbyUnionKeyEvent = {
  __typename?: 'RugbyUnionKeyEvent';
  player: Scalars['ID'];
  team: TeamSide;
  time: Scalars['Duration'];
  type?: Maybe<RugbyUnionKeyEventType>;
};

export enum RugbyUnionKeyEventType {
  Conversion = 'conversion',
  DropGoal = 'dropGoal',
  PenaltyKick = 'penaltyKick',
  RedCard = 'redCard',
  Try = 'try',
  YellowCard = 'yellowCard'
}

export type RugbyUnionLeagueTableEntry = {
  __typename?: 'RugbyUnionLeagueTableEntry';
  against: Scalars['Int'];
  difference: Scalars['Int'];
  drawn: Scalars['Int'];
  for: Scalars['Int'];
  lost: Scalars['Int'];
  played: Scalars['Int'];
  points: Scalars['Int'];
  team: Scalars['String'];
  won: Scalars['Int'];
};

export type RugbyUnionLeagueTableEntryInput = {
  against: Scalars['Int'];
  difference: Scalars['Int'];
  drawn: Scalars['Int'];
  for: Scalars['Int'];
  lost: Scalars['Int'];
  played: Scalars['Int'];
  points: Scalars['Int'];
  team: Scalars['String'];
  won: Scalars['Int'];
};

export type RugbyUnionScore = {
  __typename?: 'RugbyUnionScore';
  away: Scalars['Int'];
  home: Scalars['Int'];
};

export type SignInError = {
  __typename?: 'SignInError';
  message: Scalars['String'];
};

export type SignInInput = {
  password: Scalars['String'];
  username: Scalars['String'];
};

export type SignInResult = SignInError | SignInSuccess;

export type SignInSuccess = {
  __typename?: 'SignInSuccess';
  me: User;
  token: Scalars['String'];
};

export type Subscription = {
  __typename?: 'Subscription';
  eventChanges: Event;
};


export type SubscriptionEventChangesArgs = {
  eventId: Scalars['ID'];
};

export type Team = {
  abbreviation: Scalars['String'];
  colourPrimary: Scalars['Colour'];
  colourSecondary: Scalars['Colour'];
  id: Scalars['String'];
  name: Scalars['String'];
  players?: Maybe<Array<TeamPlayer>>;
};

export type TeamPlayer = {
  designation?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  role?: Maybe<Scalars['String']>;
};

export enum TeamSide {
  Away = 'away',
  Home = 'home'
}

export type Timer = {
  __typename?: 'Timer';
  state: TimerState;
  timeClockStarted?: Maybe<Scalars['Time']>;
  timeWhenStarted: Scalars['Duration'];
};

export enum TimerState {
  Running = 'running',
  Stopped = 'stopped'
}

export type User = {
  __typename?: 'User';
  name?: Maybe<Scalars['String']>;
  permissions: Array<Permission>;
  username?: Maybe<Scalars['String']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Colour: ResolverTypeWrapper<Scalars['Colour']>;
  CreateEventInput: CreateEventInput;
  Duration: ResolverTypeWrapper<Scalars['Duration']>;
  Event: ResolversTypes['FootballEvent'] | ResolversTypes['RugbyUnionEvent'];
  EventType: EventType;
  FootballEditInput: FootballEditInput;
  FootballEvent: ResolverTypeWrapper<FootballEvent>;
  FootballHalf: ResolverTypeWrapper<FootballHalf>;
  FootballKeyEvent: ResolverTypeWrapper<FootballKeyEvent>;
  FootballKeyEventType: FootballKeyEventType;
  FootballLeagueTableEntry: ResolverTypeWrapper<FootballLeagueTableEntry>;
  FootballLeagueTableEntryInput: FootballLeagueTableEntryInput;
  FootballScore: ResolverTypeWrapper<FootballScore>;
  GenericPlayerInput: GenericPlayerInput;
  GenericTeam: ResolverTypeWrapper<GenericTeam>;
  GenericTeamInput: GenericTeamInput;
  GenericTeamPlayer: ResolverTypeWrapper<GenericTeamPlayer>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Mutation: ResolverTypeWrapper<{}>;
  Permission: Permission;
  Query: ResolverTypeWrapper<{}>;
  RugbyUnionEditInput: RugbyUnionEditInput;
  RugbyUnionEvent: ResolverTypeWrapper<RugbyUnionEvent>;
  RugbyUnionHalf: ResolverTypeWrapper<RugbyUnionHalf>;
  RugbyUnionKeyEvent: ResolverTypeWrapper<RugbyUnionKeyEvent>;
  RugbyUnionKeyEventType: RugbyUnionKeyEventType;
  RugbyUnionLeagueTableEntry: ResolverTypeWrapper<RugbyUnionLeagueTableEntry>;
  RugbyUnionLeagueTableEntryInput: RugbyUnionLeagueTableEntryInput;
  RugbyUnionScore: ResolverTypeWrapper<RugbyUnionScore>;
  SignInError: ResolverTypeWrapper<SignInError>;
  SignInInput: SignInInput;
  SignInResult: ResolversTypes['SignInError'] | ResolversTypes['SignInSuccess'];
  SignInSuccess: ResolverTypeWrapper<SignInSuccess>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Subscription: ResolverTypeWrapper<{}>;
  Team: ResolversTypes['GenericTeam'];
  TeamPlayer: ResolversTypes['GenericTeamPlayer'];
  TeamSide: TeamSide;
  Time: ResolverTypeWrapper<Scalars['Time']>;
  Timer: ResolverTypeWrapper<Timer>;
  TimerState: TimerState;
  User: ResolverTypeWrapper<User>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean'];
  Colour: Scalars['Colour'];
  CreateEventInput: CreateEventInput;
  Duration: Scalars['Duration'];
  Event: ResolversParentTypes['FootballEvent'] | ResolversParentTypes['RugbyUnionEvent'];
  FootballEditInput: FootballEditInput;
  FootballEvent: FootballEvent;
  FootballHalf: FootballHalf;
  FootballKeyEvent: FootballKeyEvent;
  FootballLeagueTableEntry: FootballLeagueTableEntry;
  FootballLeagueTableEntryInput: FootballLeagueTableEntryInput;
  FootballScore: FootballScore;
  GenericPlayerInput: GenericPlayerInput;
  GenericTeam: GenericTeam;
  GenericTeamInput: GenericTeamInput;
  GenericTeamPlayer: GenericTeamPlayer;
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  Mutation: {};
  Query: {};
  RugbyUnionEditInput: RugbyUnionEditInput;
  RugbyUnionEvent: RugbyUnionEvent;
  RugbyUnionHalf: RugbyUnionHalf;
  RugbyUnionKeyEvent: RugbyUnionKeyEvent;
  RugbyUnionLeagueTableEntry: RugbyUnionLeagueTableEntry;
  RugbyUnionLeagueTableEntryInput: RugbyUnionLeagueTableEntryInput;
  RugbyUnionScore: RugbyUnionScore;
  SignInError: SignInError;
  SignInInput: SignInInput;
  SignInResult: ResolversParentTypes['SignInError'] | ResolversParentTypes['SignInSuccess'];
  SignInSuccess: SignInSuccess;
  String: Scalars['String'];
  Subscription: {};
  Team: ResolversParentTypes['GenericTeam'];
  TeamPlayer: ResolversParentTypes['GenericTeamPlayer'];
  Time: Scalars['Time'];
  Timer: Timer;
  User: User;
};

export type GoFieldDirectiveArgs = {
  forceResolver?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
};

export type GoFieldDirectiveResolver<Result, Parent, ContextType = any, Args = GoFieldDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type GoModelDirectiveArgs = {
  model?: Maybe<Scalars['String']>;
  models?: Maybe<Array<Scalars['String']>>;
};

export type GoModelDirectiveResolver<Result, Parent, ContextType = any, Args = GoModelDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export interface ColourScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Colour'], any> {
  name: 'Colour';
}

export interface DurationScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Duration'], any> {
  name: 'Duration';
}

export type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = {
  __resolveType: TypeResolveFn<'FootballEvent' | 'RugbyUnionEvent', ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  time?: Resolver<ResolversTypes['Time'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['EventType'], ParentType, ContextType>;
  venue?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type FootballEventResolvers<ContextType = any, ParentType extends ResolversParentTypes['FootballEvent'] = ResolversParentTypes['FootballEvent']> = {
  awayTeam?: Resolver<ResolversTypes['Team'], ParentType, ContextType>;
  halves?: Resolver<Array<ResolversTypes['FootballHalf']>, ParentType, ContextType>;
  homeTeam?: Resolver<ResolversTypes['Team'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  leagueName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  leagueTable?: Resolver<Maybe<Array<ResolversTypes['FootballLeagueTableEntry']>>, ParentType, ContextType>;
  time?: Resolver<ResolversTypes['Time'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalScore?: Resolver<ResolversTypes['FootballScore'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['EventType'], ParentType, ContextType>;
  venue?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FootballHalfResolvers<ContextType = any, ParentType extends ResolversParentTypes['FootballHalf'] = ResolversParentTypes['FootballHalf']> = {
  addedTime?: Resolver<ResolversTypes['Duration'], ParentType, ContextType>;
  keyEvents?: Resolver<Array<ResolversTypes['FootballKeyEvent']>, ParentType, ContextType>;
  score?: Resolver<ResolversTypes['FootballScore'], ParentType, ContextType>;
  timer?: Resolver<ResolversTypes['Timer'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FootballKeyEventResolvers<ContextType = any, ParentType extends ResolversParentTypes['FootballKeyEvent'] = ResolversParentTypes['FootballKeyEvent']> = {
  incomingPlayer?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  player?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  team?: Resolver<ResolversTypes['TeamSide'], ParentType, ContextType>;
  time?: Resolver<ResolversTypes['Duration'], ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['FootballKeyEventType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FootballLeagueTableEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['FootballLeagueTableEntry'] = ResolversParentTypes['FootballLeagueTableEntry']> = {
  against?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  difference?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  drawn?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  for?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lost?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  played?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  points?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  team?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  won?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FootballScoreResolvers<ContextType = any, ParentType extends ResolversParentTypes['FootballScore'] = ResolversParentTypes['FootballScore']> = {
  away?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  home?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GenericTeamResolvers<ContextType = any, ParentType extends ResolversParentTypes['GenericTeam'] = ResolversParentTypes['GenericTeam']> = {
  abbreviation?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  colourPrimary?: Resolver<ResolversTypes['Colour'], ParentType, ContextType>;
  colourSecondary?: Resolver<ResolversTypes['Colour'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  players?: Resolver<Array<ResolversTypes['GenericTeamPlayer']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GenericTeamPlayerResolvers<ContextType = any, ParentType extends ResolversParentTypes['GenericTeamPlayer'] = ResolversParentTypes['GenericTeamPlayer']> = {
  designation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  FootballAction?: Resolver<Maybe<ResolversTypes['FootballEvent']>, ParentType, ContextType, RequireFields<MutationFootballActionArgs, 'event' | 'player' | 'team' | 'type'>>;
  FootballAddTime?: Resolver<Maybe<ResolversTypes['FootballEvent']>, ParentType, ContextType, RequireFields<MutationFootballAddTimeArgs, 'addedTime' | 'event'>>;
  FootballChangeHalf?: Resolver<Maybe<ResolversTypes['FootballEvent']>, ParentType, ContextType, RequireFields<MutationFootballChangeHalfArgs, 'event'>>;
  FootballEditEvent?: Resolver<Maybe<ResolversTypes['FootballEvent']>, ParentType, ContextType, RequireFields<MutationFootballEditEventArgs, 'input'>>;
  FootballSubstitution?: Resolver<Maybe<ResolversTypes['FootballEvent']>, ParentType, ContextType, RequireFields<MutationFootballSubstitutionArgs, 'event' | 'incomingPlayer' | 'player' | 'team'>>;
  FootballTimerState?: Resolver<Maybe<ResolversTypes['FootballEvent']>, ParentType, ContextType, RequireFields<MutationFootballTimerStateArgs, 'event' | 'state'>>;
  createEvent?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<MutationCreateEventArgs, 'input'>>;
  rugbyUnionAction?: Resolver<Maybe<ResolversTypes['RugbyUnionEvent']>, ParentType, ContextType, RequireFields<MutationRugbyUnionActionArgs, 'event' | 'player' | 'team' | 'type'>>;
  rugbyUnionEditEvent?: Resolver<Maybe<ResolversTypes['RugbyUnionEvent']>, ParentType, ContextType, RequireFields<MutationRugbyUnionEditEventArgs, 'input'>>;
  rugbyUnionTimerState?: Resolver<Maybe<ResolversTypes['RugbyUnionEvent']>, ParentType, ContextType, RequireFields<MutationRugbyUnionTimerStateArgs, 'event' | 'state'>>;
  signIn?: Resolver<ResolversTypes['SignInResult'], ParentType, ContextType, RequireFields<MutationSignInArgs, 'input'>>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  allEvents?: Resolver<Maybe<Array<ResolversTypes['Event']>>, ParentType, ContextType>;
  eventById?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QueryEventByIdArgs, 'id'>>;
  futureEvents?: Resolver<Maybe<Array<ResolversTypes['Event']>>, ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
};

export type RugbyUnionEventResolvers<ContextType = any, ParentType extends ResolversParentTypes['RugbyUnionEvent'] = ResolversParentTypes['RugbyUnionEvent']> = {
  awayTeam?: Resolver<ResolversTypes['Team'], ParentType, ContextType>;
  halves?: Resolver<Array<ResolversTypes['RugbyUnionHalf']>, ParentType, ContextType>;
  homeTeam?: Resolver<ResolversTypes['Team'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  leagueName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  leagueTable?: Resolver<Maybe<Array<ResolversTypes['RugbyUnionLeagueTableEntry']>>, ParentType, ContextType>;
  time?: Resolver<ResolversTypes['Time'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalScore?: Resolver<ResolversTypes['RugbyUnionScore'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['EventType'], ParentType, ContextType>;
  venue?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RugbyUnionHalfResolvers<ContextType = any, ParentType extends ResolversParentTypes['RugbyUnionHalf'] = ResolversParentTypes['RugbyUnionHalf']> = {
  keyEvents?: Resolver<Array<ResolversTypes['RugbyUnionKeyEvent']>, ParentType, ContextType>;
  score?: Resolver<ResolversTypes['RugbyUnionScore'], ParentType, ContextType>;
  timer?: Resolver<ResolversTypes['Timer'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RugbyUnionKeyEventResolvers<ContextType = any, ParentType extends ResolversParentTypes['RugbyUnionKeyEvent'] = ResolversParentTypes['RugbyUnionKeyEvent']> = {
  player?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  team?: Resolver<ResolversTypes['TeamSide'], ParentType, ContextType>;
  time?: Resolver<ResolversTypes['Duration'], ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['RugbyUnionKeyEventType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RugbyUnionLeagueTableEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['RugbyUnionLeagueTableEntry'] = ResolversParentTypes['RugbyUnionLeagueTableEntry']> = {
  against?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  difference?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  drawn?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  for?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lost?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  played?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  points?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  team?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  won?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RugbyUnionScoreResolvers<ContextType = any, ParentType extends ResolversParentTypes['RugbyUnionScore'] = ResolversParentTypes['RugbyUnionScore']> = {
  away?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  home?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SignInErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInError'] = ResolversParentTypes['SignInError']> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SignInResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInResult'] = ResolversParentTypes['SignInResult']> = {
  __resolveType: TypeResolveFn<'SignInError' | 'SignInSuccess', ParentType, ContextType>;
};

export type SignInSuccessResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInSuccess'] = ResolversParentTypes['SignInSuccess']> = {
  me?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  eventChanges?: SubscriptionResolver<ResolversTypes['Event'], "eventChanges", ParentType, ContextType, RequireFields<SubscriptionEventChangesArgs, 'eventId'>>;
};

export type TeamResolvers<ContextType = any, ParentType extends ResolversParentTypes['Team'] = ResolversParentTypes['Team']> = {
  __resolveType: TypeResolveFn<'GenericTeam', ParentType, ContextType>;
  abbreviation?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  colourPrimary?: Resolver<ResolversTypes['Colour'], ParentType, ContextType>;
  colourSecondary?: Resolver<ResolversTypes['Colour'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  players?: Resolver<Maybe<Array<ResolversTypes['TeamPlayer']>>, ParentType, ContextType>;
};

export type TeamPlayerResolvers<ContextType = any, ParentType extends ResolversParentTypes['TeamPlayer'] = ResolversParentTypes['TeamPlayer']> = {
  __resolveType: TypeResolveFn<'GenericTeamPlayer', ParentType, ContextType>;
  designation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export interface TimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Time'], any> {
  name: 'Time';
}

export type TimerResolvers<ContextType = any, ParentType extends ResolversParentTypes['Timer'] = ResolversParentTypes['Timer']> = {
  state?: Resolver<ResolversTypes['TimerState'], ParentType, ContextType>;
  timeClockStarted?: Resolver<Maybe<ResolversTypes['Time']>, ParentType, ContextType>;
  timeWhenStarted?: Resolver<ResolversTypes['Duration'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  permissions?: Resolver<Array<ResolversTypes['Permission']>, ParentType, ContextType>;
  username?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Colour?: GraphQLScalarType;
  Duration?: GraphQLScalarType;
  Event?: EventResolvers<ContextType>;
  FootballEvent?: FootballEventResolvers<ContextType>;
  FootballHalf?: FootballHalfResolvers<ContextType>;
  FootballKeyEvent?: FootballKeyEventResolvers<ContextType>;
  FootballLeagueTableEntry?: FootballLeagueTableEntryResolvers<ContextType>;
  FootballScore?: FootballScoreResolvers<ContextType>;
  GenericTeam?: GenericTeamResolvers<ContextType>;
  GenericTeamPlayer?: GenericTeamPlayerResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RugbyUnionEvent?: RugbyUnionEventResolvers<ContextType>;
  RugbyUnionHalf?: RugbyUnionHalfResolvers<ContextType>;
  RugbyUnionKeyEvent?: RugbyUnionKeyEventResolvers<ContextType>;
  RugbyUnionLeagueTableEntry?: RugbyUnionLeagueTableEntryResolvers<ContextType>;
  RugbyUnionScore?: RugbyUnionScoreResolvers<ContextType>;
  SignInError?: SignInErrorResolvers<ContextType>;
  SignInResult?: SignInResultResolvers<ContextType>;
  SignInSuccess?: SignInSuccessResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
  TeamPlayer?: TeamPlayerResolvers<ContextType>;
  Time?: GraphQLScalarType;
  Timer?: TimerResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = any> = {
  goField?: GoFieldDirectiveResolver<any, any, ContextType>;
  goModel?: GoModelDirectiveResolver<any, any, ContextType>;
};
