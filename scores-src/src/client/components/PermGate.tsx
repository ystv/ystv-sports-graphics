import { Loader, Title, TypographyStylesProvider } from "@mantine/core";
import { ReactNode } from "react";
import { Permission } from "../../common/types";
import { useGETAuthMe } from "../lib/apiClient";

export function PermGate(props: {
  require: Permission;
  children: JSX.Element;
  fallback?: JSX.Element;
  failOpen?: boolean;
}) {
  const { data: me, loading, error } = useGETAuthMe();

  if (loading) {
    if (props.failOpen) {
      return props.children;
    }
    return <Loader />;
  }

  if (error) {
    if (props.failOpen) {
      return props.children;
    }
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
        <div>
          <Title order={1}>Unexpected error!</Title>
        </div>
        <p>
          Something went wrong. Please check your network connection and try
          again.
        </p>
        <p>
          If the problem persists, please take a screenshot of this screen and
          send it to the Graphics Team.
        </p>
        <p>error: {message} (in PermGate</p>
      </TypographyStylesProvider>
    );
  }

  if (!me) {
    return <Loader />;
  }

  if (
    me.permissions.includes(props.require) ||
    me.permissions.includes("SUDO")
  ) {
    return props.children;
  }

  if (props.fallback) {
    return props.fallback;
  }

  return (
    <TypographyStylesProvider>
      <div>
        <Title order={1}>Insufficient Permissions</Title>
      </div>
      <p>Sorry, you don&apos;t appear to have access to this.</p>
      <p>If you believe this is a mistake, please contact the Graphics Team.</p>
    </TypographyStylesProvider>
  );
}
