import {
  Stack,
  Title,
  TypographyStylesProvider,
  Button,
  Alert,
  Container,
} from "@mantine/core";
import { FormikHelpers, Formik, Form } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthToken, usePOSTLogin } from "../lib/apiClient";
import * as Yup from "yup";
import { Field } from "../../common/formFields";

const loginSchema = Yup.object({
  username: Yup.string().required(),
  password: Yup.string().required(),
});

export function LoginScreen() {
  const [error, setError] = useState<string | null>(null);
  const doRequest = usePOSTLogin();
  const navigate = useNavigate();
  async function doLogin(
    values: Yup.InferType<typeof loginSchema>,
    helpers: FormikHelpers<Yup.InferType<typeof loginSchema>>
  ) {
    setError(null);
    try {
      const result = await doRequest(values.username, values.password);
      console.log("LOGIN RESULT", result);
      setAuthToken(result.token);
      navigate("/events");
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
    } finally {
      helpers.setSubmitting(false);
    }
  }

  return (
    <Container>
      <Stack>
        <Title order={1}>Sports Scores 3</Title>
        <Stack>
          <Formik
            initialValues={{ username: "", password: "" }}
            validationSchema={loginSchema}
            onSubmit={doLogin}
          >
            {({ isSubmitting }) => (
              <Form>
                <Field name="username" title="Username" />
                <Field name="password" title="Password" type="password" />
                <Button type="submit" loading={isSubmitting}>
                  Sign In
                </Button>
                {error != null && <Alert color="red">{error}</Alert>}
              </Form>
            )}
          </Formik>
        </Stack>
      </Stack>
    </Container>
  );
}
