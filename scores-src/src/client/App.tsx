import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ListEvents } from "./pages/ListEvents";
import { Wrapper } from "./components/Wrapper";

import "bootstrap/dist/css/bootstrap.min.css";
import { CreateEventModal } from "./pages/CreateEventModal";
import { EditEventForm, EditEventModal } from "./pages/EditEventModal";
import { LiveScores } from "./pages/LiveScores";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Wrapper />}>
        <Route path="events/:type/:id" element={<LiveScores />} />
        <Route path="events" element={<ListEvents />}>
          <Route path=":type/:id/edit" element={<EditEventModal />} />
          <Route path="new" element={<CreateEventModal />} />
        </Route>

        <Route path="/" element={<Navigate replace to="/events" />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}