import {
  Field as FormikField,
  useField,
  useFormikContext,
  FieldArray,
  getIn,
  FastField,
  FieldProps as FormikFieldProps,
} from "formik";
import { useEffect } from "react";
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
      {({ field, meta, form }: FormikFieldProps<any>) => (
        <>
          {props.type == "number" ? (
            <NumberInput
              {...field}
              value={field.value}
              /* necessary to properly handle NumberInput onChange having a different param type */
              onChange={(value) => form.setFieldValue(props.name, value)}
              error={meta.touched && meta.error}
              label={props.title}
            />
          ) : (
            <TextInput
              {...field}
              value={field.value ?? ""}
              onChange={(e) => form.setFieldValue(props.name, e.target.value)}
              error={meta.touched && meta.error}
              label={props.title}
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
      {({ field, meta }: FormikFieldProps<any>) => (
        <Check {...field} label={props.title} />
        //  DON'T HAVE AN ERROR STATE CURRENTLY
      )}
    </FieldComponent>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  values: [string | null, string][];
  initialValue?: string;
}

export function SelectField(props: SelectFieldProps) {
  const [field, meta] = useField(props.name);
  return (
    <Select
      label={props.title}
      data={props.values.map((e) => ({ value: e[0], label: e[1] }))}
      {...field}
      error={meta.touched && meta.error}
    />
  );
}

export function SegmentedSelectField(props: SelectFieldProps) {
  const [field, meta, helpers] = useField(props.name);
  return (
    <SegmentedControl
      fullWidth
      data={props.values.map((e) => ({ value: e[0], label: e[1] }))}
      {...field}
      onChange={(value) => helpers.setValue(value)}
    />
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
          {field.value?.map((_: any, idx: number) => {
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
