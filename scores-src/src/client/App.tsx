import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ListEvents } from "./pages/ListEvents";
import { Wrapper } from "./components/Wrapper";

import { CreateEventModal } from "./pages/CreateEventModal";
import { EditEventModal } from "./pages/EditEventModal";
import { LiveScores } from "./pages/LiveScores";

import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import { BootstrapScreen } from "./pages/Bootstrap";
import { LoginScreen } from "./pages/Login";
import { ListUsersScreen } from "./pages/ListUsers";
import { PermGate } from "./components/PermGate";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/bootstrap" element={<BootstrapScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/" element={<Wrapper />}>
        <Route
          path="events/:type/:id"
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
            path=":type/:id/edit"
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
          <AppRoutes />
        </BrowserRouter>
      </NotificationsProvider>
    </MantineProvider>
  );
}
