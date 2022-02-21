import * as Yup from "yup";

export const BaseEvent = Yup.object().shape({
    id: Yup.string().uuid().required(),
    type: Yup.string().required(),
    name: Yup.string().required()
});

export interface EventActionTypes {
    readonly [K: string]: Yup.AnyObjectSchema;
}

export type EventActionFunctions<TEventSchema extends Yup.AnyObjectSchema, TActionTypes extends EventActionTypes> = {
    [K in keyof TActionTypes]: (value: Yup.InferType<TEventSchema>, data: Yup.InferType<TActionTypes[K]>) => void;
}
