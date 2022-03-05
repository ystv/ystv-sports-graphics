import {
  Field as FormikField,
  useField,
  useFormikContext,
  Formik,
  FieldArray,
  getIn,
  FastField,
} from "formik";
import { useEffect } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";

interface BaseFieldProps {
  name: string;
  title: string;
  helper?: string;
}

interface FieldWrapperProps extends BaseFieldProps {
  children: JSX.Element;
}

function FieldWrapper(props: FieldWrapperProps) {
  const [field, meta] = useField(props.name);
  return (
    <Form.Group>
      <Form.Label>{props.title}</Form.Label>
      {props.children}
      {meta.touched && meta.error && (
        <Form.Control.Feedback type="invalid">
          {meta.error}
        </Form.Control.Feedback>
      )}
      {props.helper && (
        <Form.Text className="text-muted">{props.helper}</Form.Text>
      )}
    </Form.Group>
  );
}

interface FieldProps extends BaseFieldProps {
  type?: JSX.IntrinsicElements["input"]["type"];
  independent?: boolean;
}

export function Field(props: FieldProps) {
  const FieldComponent = props.independent ? FastField : FormikField;
  return (
    <FieldComponent name={props.name}>
      {({ field, meta }) => (
        <FieldWrapper {...props}>
          <Form.Control
            {...field}
            type={props.type}
            isValid={meta.touched && !meta.error}
            isInvalid={meta.touched && !!meta.error}
          />
        </FieldWrapper>
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
      {({ field, meta }) => (
        <FieldWrapper {...props}>
          <Form.Check
            {...field}
            type="checkbox"
            isValid={meta.touched && !meta.error}
            isInvalid={meta.touched && !!meta.error}
          />
        </FieldWrapper>
      )}
    </FieldComponent>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  values: [string, string][];
  initialValue?: string;
}

export function SelectField(props: SelectFieldProps) {
  const [field, meta] = useField(props.name);
  return (
    <FieldWrapper {...props}>
      <Form.Select
        {...field}
        isValid={meta.touched && !meta.error}
        isInvalid={meta.touched && !!meta.error}
      >
        {typeof props.initialValue !== "string" && (
          <option
            value={undefined}
            disabled
            selected={typeof field.value === "undefined"}
          >
            Please select
          </option>
        )}
        {props.values.map(([name, label]) => (
          <option key={name} value={name}>
            {label}
          </option>
        ))}
      </Form.Select>
    </FieldWrapper>
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
        <Form.Group style={{ margin: "auto 1em" }}>
          {props.title && <Form.Label>{props.title}</Form.Label>}
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
        </Form.Group>
      )}
    />
  );
}
