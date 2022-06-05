/**
 * These components live in client, not in common/formFields, because they use the API hooks.
 */

import { Alert, Button, InputWrapper, Select, SelectItem } from "@mantine/core";
import { useModals } from "@mantine/modals";
import { Form, Formik, FormikHelpers, useField } from "formik";
import { useState } from "react";
import { BaseFieldProps, ColourField, Field } from "../../common/formFields";
import { TeamInfo, TeamInfoSchema } from "../../common/types";
import { useGETTeams, usePOSTTeams } from "../lib/apiClient";

type TeamSelectProps = BaseFieldProps;

function CreateTeamModalContents(props: {
  onCreate?: (slug: string) => unknown;
}) {
  const schema = TeamInfoSchema.omit(["slug", "crestAttachmentID"]);
  const [crestFile, setCrestFile] = useState<File | null>(null);
  const save = usePOSTTeams();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function create(values: TeamInfo, helpers: FormikHelpers<TeamInfo>) {
    if (!crestFile) {
      helpers.setFieldTouched("crest", true);
      helpers.setFieldError("crest", "no crest file selected");
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError(null);
      const result = await save(values, crestFile);
      if (props.onCreate) {
        props.onCreate(result.slug);
      }
    } catch (e) {
      setSubmitError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Formik
      validationSchema={schema}
      initialValues={schema.cast({})}
      onSubmit={create}
    >
      {({ errors, touched, handleSubmit }) => (
        <Form>
          <Field name="name" title="Name" />
          <Field
            name="abbreviation"
            title="Abbreviation"
            helper="3 or 4 letters"
          />
          <ColourField name="primaryColour" title="Primary Colour" />
          <ColourField name="secondaryColour" title="Secondary Colour" />
          <InputWrapper
            label="Team Crest"
            description="SVG please"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error={(touched as any).crest && (errors as any).crest}
          >
            <input
              type="file"
              name="crest"
              onChange={(e) => setCrestFile(e.target.files?.[0] ?? null)}
              accept=".svg"
            />
          </InputWrapper>
          <Button
            onClick={() => handleSubmit()}
            disabled={submitting}
            data-cy="submit"
          >
            Create
          </Button>
          {submitError !== null && (
            <Alert>Could not create! {submitError}</Alert>
          )}
          {import.meta.env.DEV && <code>{JSON.stringify(errors)}</code>}
        </Form>
      )}
    </Formik>
  );
}

function useCreateTeamModal() {
  const modals = useModals();

  return (onCreate?: (slug: string) => unknown) => {
    const id = modals.openModal({
      title: "Create Team",
      children: <CreateTeamModalContents onCreate={onCreate} />,
      zIndex: 300,
    });
  };
}

export function TeamSelectField(props: TeamSelectProps) {
  const [field, meta, helpers] = useField(props.name);
  const { data: teams, error, loading } = useGETTeams();
  const showCreateTeamModal = useCreateTeamModal();

  let data: SelectItem[];
  if (loading) {
    data = [{ label: "Loading...", value: "", disabled: true }];
  } else if (error) {
    data = [{ label: "Something went wrong!", value: "", disabled: true }];
  } else {
    data = teams.map((team) => ({ value: team.slug, label: team.name }));
  }

  return (
    <Select
      {...field}
      onChange={(value) => helpers.setValue(value)}
      label={props.title}
      description={props.helper}
      data={data}
      searchable
      creatable
      getCreateLabel={(name) => `Create ${name}`}
      onCreate={() => showCreateTeamModal((slug) => helpers.setValue(slug))}
    />
  );
}
