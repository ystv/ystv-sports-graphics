import { Field as FormikField, useField, useFormikContext } from "formik";
import { Form } from "react-bootstrap";

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
}

export function Field(props: FieldProps) {
  const [field, meta] = useField(props.name);
  return (
    <FieldWrapper {...props}>
      <Form.Control
        {...field}
        type={props.type}
        isValid={meta.touched && !meta.error}
        isInvalid={meta.touched && !!meta.error}
      />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  values: [string, string][];
  initialValue?: string;
}

export function SelectField(props: SelectFieldProps) {
  const [field, meta] = useField(props.name);
  console.log("select field", field);
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
