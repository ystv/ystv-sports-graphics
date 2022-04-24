import { Button, Title, Group } from "@mantine/core";

export type LiveKillCallback = (value: boolean) => unknown;

export const LiveButton = ({
  callback,
  disabled,
}: {
  callback: LiveKillCallback;
  disabled?: boolean;
}) => (
  <Button onClick={() => callback(true)} color="green" disabled={disabled}>
    LIVE
  </Button>
);

export const KillButton = ({
  callback,
  disabled,
}: {
  callback: LiveKillCallback;
  disabled?: boolean;
}) => (
  <Button onClick={() => callback(false)} color="red" disabled={disabled}>
    KILL
  </Button>
);

export const LiveKillButtons = ({
  name,
  live,
  callback,
  children,
  divider,
  disabled,
}: {
  name: string;
  live: boolean;
  callback: LiveKillCallback;
  children?: JSX.Element;
  divider?: boolean;
  disabled?: boolean;
}) => (
  <>
    <Title order={2}>{name}</Title>
    <strong>Status: {live ? "LIVE" : "HIDDEN"}</strong>
    <br />
    <Group>
      <LiveButton callback={callback} disabled={disabled} />
      <KillButton callback={callback} disabled={disabled} />
    </Group>
    {children}
    <br />
    {divider && (
      <>
        <br />
        <hr style={{ borderTopWidth: "2px", borderColor: "grey" }} />
      </>
    )}
  </>
);
