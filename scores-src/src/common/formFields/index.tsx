import {
  Field as FormikField,
  useField,
  useFormikContext,
  FieldArray,
  getIn,
  FastField,
  FieldProps as FormikFieldProps,
} from "formik";
import { ChangeEvent, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  TextInput,
  Checkbox as Check,
  Select,
  Button,
  NumberInput,
  Stack,
  Title,
  SegmentedControl,
  InputWrapper,
  PasswordInput,
  MultiSelect,
} from "@mantine/core";

interface BaseFieldProps {
  name: string;
  title: string;
  helper?: string;
}

interface FieldWrapperProps extends BaseFieldProps {
  children: JSX.Element;
}

interface FieldProps extends BaseFieldProps {
  type?: JSX.IntrinsicElements["input"]["type"];
  independent?: boolean;
}

export function Field(props: FieldProps) {
  const FieldComponent = props.independent ? FastField : FormikField;
  return (
    <FieldComponent name={props.name}>
      {/*eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {({ field, meta, form }: FormikFieldProps<any>) => (
        <>
          {props.type == "number" ? (
            <NumberInput
              {...field}
              value={field.value}
              /* necessary to properly handle NumberInput onChange having a different param type */
              onChange={(value: number) =>
                form.setFieldValue(props.name, value)
              }
              error={meta.touched && meta.error}
              label={props.title}
              description={props.helper}
            />
          ) : props.type === "password" ? (
            <PasswordInput
              {...field}
              error={meta.touched && meta.error}
              label={props.title}
              description={props.helper}
            />
          ) : (
            <TextInput
              {...field}
              value={field.value ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                form.setFieldValue(props.name, e.target.value)
              }
              error={meta.touched && meta.error}
              label={props.title}
              description={props.helper}
            />
          )}
        </>
      )}
    </FieldComponent>
  );
}

interface CheckboxProps extends BaseFieldProps {
  independent?: boolean;
}

export function Checkbox(props: CheckboxProps) {
  const FieldComponent = props.independent ? FastField : FormikField;
  return (
    <FieldComponent name={props.name} type="checkbox">
      {/*eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {({ field, meta }: FormikFieldProps<any>) => (
        <Check {...field} label={props.title} />
        //  DON'T HAVE AN ERROR STATE CURRENTLY
      )}
    </FieldComponent>
  );
}

interface MultiSelectFieldProps extends SelectFieldProps {
  values: [string, string][];
}

export function MultiSelectField(props: MultiSelectFieldProps) {
  const [field, meta, helpers] = useField(props.name);
  return (
    <MultiSelect
      data={props.values.map(([value, label]) => ({ value, label }))}
      value={field.value}
      onChange={(vals) => helpers.setValue(vals)}
      label={props.title}
      error={meta.touched && meta.error}
      description={props.helper}
    />
  );
}

interface SelectFieldProps extends BaseFieldProps {
  values: [string | null, string][];
  initialValue?: string;
  helper?: string;
}

const nullSigil = "$NULL$";

export function SelectField(props: SelectFieldProps) {
  const [field, meta, helpers] = useField(props.name);
  return (
    <Select
      label={props.title}
      data={props.values.map((e) => ({
        value: e[0] ?? nullSigil,
        label: e[1],
      }))}
      {...field}
      onChange={(value: string) =>
        helpers.setValue(value === nullSigil ? null : value)
      }
      error={meta.touched && meta.error}
      description={props.helper}
      defaultValue={props.initialValue}
    />
  );
}

export interface SegmentedSelectFieldProps extends SelectFieldProps {
  values: [string, string][];
}

export function SegmentedSelectField(props: SegmentedSelectFieldProps) {
  useEffect(() => {
    helpers.setValue(props.values[0][0]);
  }, []);

  const [field, meta, helpers] = useField(props.name);
  return (
    <InputWrapper description={props.helper}>
      <SegmentedControl
        fullWidth
        data={props.values.map((e) => ({ value: e[0], label: e[1] }))}
        {...field}
        onChange={(value: string) => helpers.setValue(value)}
        value={field.value}
      />
    </InputWrapper>
  );
}

export function RandomUUIDField(props: { name: string }) {
  const [_, meta, helpers] = useField(props.name);
  useEffect(() => {
    if ((meta.value ?? "").length === 0) {
      const newVal = uuidv4();
      console.log("setting value of", props.name, "to", newVal);
      helpers.setValue(newVal);
    }
  }, [meta.value]);
  return null;
}

interface ArrayFieldProps {
  name: string;
  title?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialChildValue: any;
  renderChild: (props: { namespace: string }) => React.ReactNode;
}

export function ArrayField(props: ArrayFieldProps) {
  const [field, meta] = useField(props.name);
  const formik = useFormikContext();
  return (
    <FieldArray
      name={props.name}
      render={(arrayHelpers) => (
        <Stack>
          {props.title && <Title order={4}>{props.title}</Title>}
          {field.value?.map((_: unknown, idx: number) => {
            const namespace = `${props.name}[${idx}]`;
            const errorMaybe = getIn(formik.errors, namespace);
            return (
              <div key={idx}>
                {props.renderChild({ namespace: namespace + "." })}
                <div>
                  {idx !== field.value.length - 1 && (
                    <Button
                      onClick={() =>
                        arrayHelpers.insert(idx, props.initialChildValue)
                      }
                      size="sm"
                    >
                      +
                    </Button>
                  )}
                  <Button onClick={() => arrayHelpers.remove(idx)} size="sm">
                    -
                  </Button>
                  {typeof errorMaybe === "string" && (
                    <div className="text-danger">{errorMaybe}</div>
                  )}
                </div>
              </div>
            );
          })}
          <Button
            onClick={() => arrayHelpers.push(props.initialChildValue)}
            size="sm"
          >
            +
          </Button>
          {typeof meta.error === "string" && (
            <div className="text-danger">{meta.error}</div>
          )}
        </Stack>
      )}
    />
  );
}
