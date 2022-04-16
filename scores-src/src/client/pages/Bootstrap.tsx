import {
  Alert,
  Button,
  Container,
  Header,
  PasswordInput,
  Stack,
  TextInput,
  Title,
  TypographyStylesProvider,
} from "@mantine/core";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  useGETBootstrapReady,
  usePOSTBootstrap,
  usePOSTBootstrapCheckToken,
} from "../lib/apiClient";
import * as Yup from "yup";
import { Form, Formik, FormikHelpers } from "formik";
import { Field } from "../../common/formFields";
import { useNavigate } from "react-router-dom";

function EnterTokenScreen(props: {
  checkToken: (token: string) => Promise<boolean>;
}) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function check() {
    setError(null);
    try {
      const valid = await props.checkToken(token);
      if (!valid) {
        setError("Invalid token. Please check and try again.");
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
    }
  }

  return (
    <Container>
      <Stack>
        <Title order={1}>Bootstrap</Title>
        <TypographyStylesProvider>
          <p>Welcome to Sports Scores 3!</p>
          <p>This instance has not been bootstrapped.</p>
          <p>
            If you have no idea what that means, send the Graphics Team a
            screenshot of this screen and let them sort it out.
          </p>
          <p>
            If you <em>do</em> know what this means, get the bootstrap token
            from either:
          </p>
          <ul>
            <li>
              the logs - search for &quot;<code>bootstrap this instance</code>
              &quot;
            </li>
            <li>
              the database - find <code>BootstrapState</code> in the default
              collection
            </li>
          </ul>
          <p>Once you have found it, enter it below.</p>
        </TypographyStylesProvider>
        <TextInput
          label="Bootstrap Token"
          placeholder="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
          value={token}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setToken(e.target.value)
          }
          error={error}
        />
        <Button onClick={check}>Check Token</Button>
      </Stack>
    </Container>
  );
}

const bootstrapSchema = Yup.object({
  username: Yup.string().required(),
  password: Yup.string().required(),
});

function PerformBootstrapScreen(props: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const doRequest = usePOSTBootstrap();
  const navigate = useNavigate();
  async function doBootstrap(
    values: Yup.InferType<typeof bootstrapSchema>,
    helpers: FormikHelpers<Yup.InferType<typeof bootstrapSchema>>
  ) {
    setError(null);
    try {
      await doRequest(props.token, values.username, values.password);
      navigate("/login");
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
        <Title order={1}>Bootstrap</Title>
        <TypographyStylesProvider>
          <p>Token verified.</p>
          <p>
            Please enter the details of the initial user below. This user will
            have all permissions in the system.
          </p>
        </TypographyStylesProvider>
        <Stack>
          <Formik
            initialValues={{ username: "", password: "" }}
            validationSchema={bootstrapSchema}
            onSubmit={doBootstrap}
          >
            {({ isSubmitting }) => (
              <Form>
                <Field name="username" title="Username" />
                <Field name="password" title="Password" type="password" />
                <Button type="submit" loading={isSubmitting}>
                  Bootstrap
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

export function BootstrapScreen() {
  const ready = useGETBootstrapReady();
  const navigate = useNavigate();

  const [stage, setStage] = useState<0 | 1>(0);
  const tokenRef = useRef<string>();

  const checkToken = usePOSTBootstrapCheckToken();

  useEffect(() => {
    if (ready.data?.ready === true) {
      navigate("/login");
    }
  }, [ready.data?.ready]);

  async function check(token: string) {
    const result = await checkToken(token);
    if (result) {
      tokenRef.current = token;
      setStage(1);
      return true;
    } else {
      return false;
    }
  }

  switch (stage) {
    case 0:
      return <EnterTokenScreen checkToken={check} />;
    case 1:
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return <PerformBootstrapScreen token={tokenRef.current!} />;
  }
}
