import * as Yup from "yup";
import {
  Button,
  Card,
  Loader,
  Stack,
  Title,
  TypographyStylesProvider,
  Text,
  Group,
  Alert,
  Modal,
} from "@mantine/core";
import { Form, Formik, FormikHelpers } from "formik";
import { Link } from "react-router-dom";
import { Permission, User } from "../../common/types";
import {
  useDELETEUsersUsername,
  useGETUsers,
  usePOSTUsers,
  usePUTUsersUsername,
  usePUTUsersUsernamePassword,
} from "../lib/apiClient";
import { Field, MultiSelectField } from "../../common/formFields";
import { useState } from "react";
import { showNotification } from "@mantine/notifications";

const EditUserSchema = Yup.object({
  permissions: Yup.array()
    .of(
      Yup.mixed<Permission>()
        .oneOf(["SUDO", "read", "write", "admin"])
        .required()
    )
    .required(),
});

const CreateUserSchema = EditUserSchema.shape({
  username: Yup.string().required(),
  password: Yup.string().required(),
});

type UserFormProps =
  | {
      mode: "create";
      submit: (
        values: Yup.InferType<typeof CreateUserSchema>
      ) => Promise<unknown>;
      close: () => unknown;
    }
  | {
      mode: "edit";
      initialValues: User;
      submit: (
        values: Yup.InferType<typeof EditUserSchema>
      ) => Promise<unknown>;
      close: () => unknown;
    };

function UserForm(props: UserFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  async function submit<
    T =
      | Yup.InferType<typeof CreateUserSchema>
      | Yup.InferType<typeof EditUserSchema>
  >(values: T, helpers: FormikHelpers<T>) {
    setSubmitError(null);
    helpers.setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await props.submit(values as any);
      props.close();
    } catch (e) {
      setSubmitError(String(e));
    } finally {
      helpers.setSubmitting(false);
    }
  }
  return (
    <Formik
      initialValues={
        props.mode === "edit"
          ? props.initialValues
          : {
              username: "",
              password: "",
              permissions: [],
            }
      }
      validationSchema={
        props.mode === "create" ? CreateUserSchema : EditUserSchema
      }
      onSubmit={submit}
    >
      {({ handleSubmit, isSubmitting, errors }) => (
        <Form>
          <Title order={1}>
            {props.mode === "create"
              ? "New User"
              : `Editing ${props.initialValues.username}`}
          </Title>
          {props.mode === "create" && (
            <>
              <Field name="username" title="Username" independent />
              <Field
                name="password"
                title="Password"
                type="password"
                independent
              />
            </>
          )}
          <MultiSelectField
            name="permissions"
            title="Permissions"
            values={[
              ["SUDO", "Sudo (can do anything!)"],
              ["read", "Read (can view events)"],
              ["write", "Write (can update events)"],
              ["admin", "Admin (can manage the system)"],
              ["dangerZone", "Danger Zone"],
            ]}
          />
          <Button onClick={() => handleSubmit()} disabled={isSubmitting}>
            Create
          </Button>
          {submitError !== null && (
            <Alert>
              Could not {props.mode}! {submitError}
            </Alert>
          )}
          {import.meta.env.DEV && <code>{JSON.stringify(errors)}</code>}
        </Form>
      )}
    </Formik>
  );
}

const ResetPasswordSchema = Yup.object({
  password: Yup.string().required(),
});

function ResetPasswordForm(props: {
  username: string;
  submit: (data: { password: string }) => Promise<unknown>;
  close: () => unknown;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  async function submit<T = Yup.InferType<typeof ResetPasswordSchema>>(
    values: T,
    helpers: FormikHelpers<T>
  ) {
    setSubmitError(null);
    helpers.setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await props.submit(values as any);
      props.close();
    } catch (e) {
      setSubmitError(String(e));
    } finally {
      helpers.setSubmitting(false);
    }
  }
  return (
    <Formik
      initialValues={{
        password: "",
      }}
      validationSchema={ResetPasswordSchema}
      onSubmit={submit}
    >
      {({ handleSubmit, isSubmitting, errors }) => (
        <Form>
          <Title order={1}>Password Reset for {props.username}</Title>
          <Field
            name="password"
            title="New Password"
            type="password"
            independent
          />
          <Button onClick={() => handleSubmit()} disabled={isSubmitting}>
            Save
          </Button>
          {submitError !== null && (
            <Alert>Could not reset password! {submitError}</Alert>
          )}
          {import.meta.env.DEV && <code>{JSON.stringify(errors)}</code>}
        </Form>
      )}
    </Formik>
  );
}

export function ListUsersScreen() {
  const { data, error, loading } = useGETUsers();

  const [showCreate, setShowCreate] = useState(false);
  const create = usePOSTUsers();

  const [editing, setEditing] = useState<User | null>(null);
  const update = usePUTUsersUsername();

  const [resettingPasswordFor, setResettingPasswordFor] = useState<User | null>(
    null
  );
  const resetPassword = usePUTUsersUsernamePassword();

  const [deleting, setDeleting] = useState<User | null>(null);
  const deleteUser = useDELETEUsersUsername();

  if (loading) {
    return (
      <div>
        <Title order={1}>Loading, please wait...</Title>
        <Loader />
      </div>
    );
  }

  if (error) {
    let message;
    if (error instanceof Error) {
      message = error.message;
      if ("status" in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message += ` [status: ${(error as any).status}]`;
      }
    } else {
      message = JSON.stringify(error);
    }
    return (
      <TypographyStylesProvider>
        <h1>Sorry, something went wrong!</h1>
        <p>
          Please check your network connection and try again. If you still have
          problems, please send a screenshot of this screen to the Graphics
          Team.
        </p>
        <code>{message}</code>
      </TypographyStylesProvider>
    );
  }

  return (
    <>
      <Title order={1}>Users</Title>
      <Button
        onClick={() => setShowCreate(true)}
        mt={"lg"}
        mb={"lg"}
        color={"green"}
      >
        Create New
      </Button>
      <Stack>
        {data.map((user) => (
          <Card withBorder radius="md" key={user.username}>
            <Text size="lg" weight={500}>
              {user.username}
            </Text>
            <Text size="xs" color="dimmed" my={3} transform="capitalize">
              Permissions: {user.permissions.join(", ")}
            </Text>
            <Group>
              <Button
                onClick={() => setEditing(user)}
                color={"blue"}
                variant="outline"
              >
                Edit
              </Button>
              <Button
                onClick={() => setResettingPasswordFor(user)}
                color="cyan"
                variant="outline"
              >
                Reset Password
              </Button>
              <Button
                onClick={() => setDeleting(user)}
                color="red"
                variant="subtle"
                disabled={data.length < 2}
              >
                Delete User
              </Button>
            </Group>
          </Card>
        ))}
      </Stack>
      <Modal opened={showCreate} onClose={() => setShowCreate(false)}>
        <UserForm
          mode="create"
          submit={(vals) => create(vals)}
          close={() => setShowCreate(false)}
        />
      </Modal>
      <Modal opened={editing !== null} onClose={() => setEditing(null)}>
        {editing !== null && (
          <UserForm
            mode="edit"
            initialValues={editing}
            submit={(vals) => update(editing.username, vals)}
            close={() => setEditing(null)}
          />
        )}
      </Modal>
      <Modal
        opened={resettingPasswordFor !== null}
        onClose={() => setResettingPasswordFor(null)}
      >
        {resettingPasswordFor !== null && (
          <ResetPasswordForm
            username={resettingPasswordFor.username}
            submit={(data) =>
              resetPassword(resettingPasswordFor.username, data)
            }
            close={() => setResettingPasswordFor(null)}
          />
        )}
      </Modal>
      <Modal opened={deleting !== null} onClose={() => setDeleting(null)}>
        {deleting !== null && (
          <Stack>
            <Text>Are you sure you want to delete {deleting.username}?</Text>
            <Group>
              <Button variant="subtle" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button
                variant="filled"
                color="red"
                onClick={() =>
                  deleteUser(deleting.username)
                    .then(() => setDeleting(null))
                    .catch((e) =>
                      showNotification({
                        message:
                          "Failed to delete: " +
                          (e instanceof Error ? e.message : String(e)),
                      })
                    )
                }
              >
                Delete
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
