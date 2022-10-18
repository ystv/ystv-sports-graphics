import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";

import { Wrapper } from "./components/Wrapper";

import { ListEvents } from "./pages/ListEvents";
import { CreateEventModal } from "./pages/CreateEventModal";
import { EditEventModal } from "./pages/EditEventModal";
import { LiveScores } from "./pages/LiveScores";
import { BootstrapScreen } from "./pages/Bootstrap";
import { LoginScreen } from "./pages/Login";
import { ListUsersScreen } from "./pages/ListUsers";
import { PermGate } from "./components/PermGate";
import { ListTeamsScreen } from "./pages/ListTeams";
import { ListLeaguesScreen } from "./pages/ListLeagues";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/bootstrap" element={<BootstrapScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/" element={<Wrapper />}>
        <Route
          path="events/:league/:type/:id"
          element={
            <PermGate require="read">
              <LiveScores />
            </PermGate>
          }
        />
        <Route
          path="events"
          element={
            <PermGate require="read">
              <ListEvents />
            </PermGate>
          }
        >
          <Route
            path=":league/:type/:id/edit"
            element={
              <PermGate require="write">
                <EditEventModal />
              </PermGate>
            }
          />
          <Route
            path="new"
            element={
              <PermGate require="write">
                <CreateEventModal />
              </PermGate>
            }
          />
        </Route>

        <Route
          path="users"
          element={
            <PermGate require="admin">
              <ListUsersScreen />
            </PermGate>
          }
        />

        <Route
          path="teams"
          element={
            <PermGate require="write">
              <ListTeamsScreen />
            </PermGate>
          }
        />

        <Route
          path="leagues"
          element={
            <PermGate require="admin">
              <ListLeaguesScreen />
            </PermGate>
          }
        />

        <Route path="/" element={<Navigate replace to="/events" />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <MantineProvider>
      <NotificationsProvider>
        <BrowserRouter>
          <ModalsProvider>
            <AppRoutes />
          </ModalsProvider>
        </BrowserRouter>
      </NotificationsProvider>
    </MantineProvider>
  );
}
