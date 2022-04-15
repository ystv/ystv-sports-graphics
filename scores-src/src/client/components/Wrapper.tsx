import { Outlet, NavLink, NavLinkProps } from "react-router-dom";
import { useState } from "react";

import {
  AppShell,
  Navbar,
  Header,
  Text,
  MediaQuery,
  Burger,
  Title,
  UnstyledButton,
  Group,
  ThemeIcon,
} from "@mantine/core";

import CalendarEvent from "tabler-icons-react/dist/icons/calendar-event";

export function Wrapper() {
  const [opened, setOpened] = useState(false);

  function MainLink({ icon, color, label, link }: MainLinkProps) {
    return (
      <NavLink to={link}>
        <UnstyledButton
          onClick={() => setOpened(false)}
          sx={(theme) => ({
            display: "block",
            width: "100%",
            padding: theme.spacing.xs,
            borderRadius: theme.radius.sm,
            color:
              theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,

            "&:hover": {
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[0],
            },
          })}
        >
          <Group>
            <ThemeIcon color={color} variant="light">
              {icon}
            </ThemeIcon>

            <Text size="sm">{label}</Text>
          </Group>
        </UnstyledButton>
      </NavLink>
    );
  }
  return (
    <>
      <AppShell
        navbarOffsetBreakpoint="sm"
        asideOffsetBreakpoint="sm"
        fixed
        navbar={
          <Navbar
            p="md"
            hiddenBreakpoint="sm"
            hidden={!opened}
            width={{ sm: 150, lg: 200 }}
          >
            {data.map((link) => (
              <MainLink {...link} key={link.label} />
            ))}
          </Navbar>
        }
        header={
          <Header height={70} p="md">
            <div
              style={{ display: "flex", alignItems: "center", height: "100%" }}
            >
              <MediaQuery largerThan="sm" styles={{ display: "none" }}>
                <Burger
                  opened={opened}
                  onClick={() => setOpened((o) => !o)}
                  size="sm"
                  mr="xl"
                />
              </MediaQuery>
              <Title order={2}>YSTV Sports Scores 3</Title>
            </div>
          </Header>
        }
      >
        <Outlet />
      </AppShell>
    </>
  );
}

interface MainLinkProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  link: string;
}

const data = [
  {
    icon: <CalendarEvent size={16} />,
    color: "blue",
    label: "Events",
    link: "/events",
  },
  // { icon: <Shirt size={16} />, color: "red", label: "Clubs", link: "/" },
];
