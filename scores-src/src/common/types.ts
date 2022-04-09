import * as Yup from "yup";
import { TypedSchema } from "yup/lib/util/types";

export const BaseEvent = Yup.object().shape({
  id: Yup.string().uuid().required(),
  type: Yup.string().required(),
  name: Yup.string().required(),
  notCovered: Yup.boolean().default(false),
  winner: Yup.string()
    .oneOf(["home", "away", null])
    .nullable(true)
    .default(null)
    .notRequired(),
  worthPoints: Yup.number().integer().required().min(0),
});

export type BaseEventType = Yup.InferType<typeof BaseEvent>;

export interface EventActionTypes<TEventSchema extends Yup.AnySchema> {
  readonly [K: string]: {
    schema: Yup.AnyObjectSchema;
    valid?: (state: Yup.InferType<TEventSchema>) => boolean;
  };
}

export type EventActionFunctions<
  TEventSchema extends Yup.AnyObjectSchema,
  TActionTypes extends EventActionTypes<TEventSchema>
> = {
  [K in keyof TActionTypes]: (
    value: Yup.InferType<TEventSchema>,
    data: Yup.InferType<TActionTypes[K]["schema"]>
  ) => void;
};

export interface ActionFormProps<TEventSchema extends TypedSchema> {
  currentState: Yup.InferType<TEventSchema>;
}

interface EventActionInfo<TEventSchema extends TypedSchema> {
  schema: Yup.AnyObjectSchema;
  Form: (props: ActionFormProps<TEventSchema>) => JSX.Element;
  valid?: (state: Yup.InferType<TEventSchema>) => boolean;
}

export interface EventTypeInfo<T extends Yup.AnyObjectSchema> {
  schema: T;
  EditForm: () => JSX.Element;
  RenderScore: (props: {
    value: Yup.InferType<T>;
    actions: React.ReactNode;
  }) => JSX.Element;
  actions: Record<string, EventActionInfo<T>>;
}
