import { Field as FormikField, useField, useFormikContext } from "formik";
import { Form } from "react-bootstrap";

interface FieldProps {
  name: string;
  title: string;
  type?: JSX.IntrinsicElements["input"]["type"];
  helper?: string;
}

export function Field(props: FieldProps) {
  const [field, meta] = useField(props.name);
  return (
    <Form.Group>
      <Form.Label>{props.title}</Form.Label>
      <Form.Control
        {...field}
        type={props.type}
        isValid={meta.touched && !meta.error}
        isInvalid={meta.touched && !!meta.error}
      />
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
