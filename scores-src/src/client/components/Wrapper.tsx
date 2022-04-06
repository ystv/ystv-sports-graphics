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
} from "@mantine/core";

function NavbarLink(props: NavLinkProps) {
  return (
    <NavLink {...props} className="nav-link">
      {props.children}
    </NavLink>
  );
}

export function Wrapper() {
  const [opened, setOpened] = useState(false);
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
            <NavbarLink to="/events">Events</NavbarLink>
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
              <Title order={2}>YSTV Sports Scores</Title>
            </div>
          </Header>
        }
      >
        <Outlet />
      </AppShell>
    </>
  );
}
