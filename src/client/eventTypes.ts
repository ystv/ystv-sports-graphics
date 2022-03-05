import * as Yup from "yup";

import {
  schema as footballSchema,
  EditForm as FootballEditForm,
  RenderScore as FootballRenderScore,
} from "../common/sports/football";

interface EventActionInfo {
  schema: Yup.AnyObjectSchema;
  Form: () => JSX.Element;
}

interface EventTypeInfo<T extends Yup.AnyObjectSchema> {
  schema: T;
  EditForm: () => JSX.Element;
  RenderScore: (props: {
    value: Yup.InferType<T>;
    actions: JSX.Element;
  }) => JSX.Element;
  actions: Record<string, EventActionInfo>;
}

export const EVENTS: Record<string, EventTypeInfo<any>> = {
  football: {
    schema: footballSchema,
    EditForm: FootballEditForm,
    RenderScore: FootballRenderScore,
    actions: {},
  },
};
