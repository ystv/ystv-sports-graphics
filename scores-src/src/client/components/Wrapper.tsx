import { Outlet, NavLink, NavLinkProps, useNavigate } from "react-router-dom";
import { ReactNode, useState } from "react";

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

import { IconCalendarEvent, IconUser, IconShieldLock } from "@tabler/icons";
import { setAuthToken } from "../lib/apiClient";
import { Permission } from "../../common/types";
import { PermGate } from "./PermGate";

export function Wrapper() {
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();

  function MainLink(props: MainLinkProps) {
    const { icon, color, label } = props;
    const contents = (
      <UnstyledButton
        onClick={() => {
          if ("onClick" in props) {
            props.onClick();
          }
          setOpened(false);
        }}
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
    );
    const Wrapper = ({ children }: { children: JSX.Element }) => {
      if (props.require) {
        return (
          <PermGate require={props.require} fallback={<></>}>
            {children}
          </PermGate>
        );
      }
      return children;
    };
    if ("link" in props) {
      return (
        <Wrapper>
          <NavLink to={props.link}>{contents}</NavLink>
        </Wrapper>
      );
    }
    return <Wrapper>{contents}</Wrapper>;
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
            {[
              {
                icon: <IconCalendarEvent size={16} />,
                color: "blue",
                label: "Events",
                link: "/events",
                require: "read" as Permission,
              },
              {
                icon: <IconShieldLock size={16} />,
                color: "orange",
                label: "Users",
                link: "/users",
                require: "admin" as Permission,
              },
              {
                icon: <IconUser size={16} />,
                color: "yellow",
                label: "Sign Out",
                onClick: () => {
                  setAuthToken(null);
                  navigate("/login");
                },
              },
            ].map((link) => (
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

type MainLinkProps = {
  icon: React.ReactNode;
  color: string;
  label: string;
  require?: Permission;
} & ({ link: string } | { onClick: () => unknown });
