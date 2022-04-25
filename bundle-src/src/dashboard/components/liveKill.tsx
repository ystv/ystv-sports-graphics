import { Button, Title, Group } from "@mantine/core";

export type LiveKillCallback = (value: boolean) => unknown;

export const LiveButton = ({ callback }: { callback: LiveKillCallback }) => (
  <Button onClick={() => callback(true)} color="green">
    LIVE
  </Button>
);

export const KillButton = ({ callback }: { callback: LiveKillCallback }) => (
  <Button onClick={() => callback(false)} color="red">
    KILL
  </Button>
);

export const LiveKillButtons = ({
  name,
  live,
  callback,
  children,
}: {
  name: string;
  live: boolean;
  callback: LiveKillCallback;
  children?: JSX.Element;
}) => (
  <>
    <Title order={2}>{name}</Title>
    <strong>Status: {live ? "LIVE" : "HIDDEN"}</strong>
    <br />
    <Group>
      <LiveButton callback={callback} />
      <KillButton callback={callback} />
    </Group>
    {children}
    <br />
    <br />
    <hr style={{ borderTopWidth: "2px", borderColor: "grey" }} />
  </>
);
