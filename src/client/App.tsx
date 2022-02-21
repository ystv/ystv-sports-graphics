import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ListEvents } from "./components/ListEvents";
import { Wrapper } from "./components/Wrapper";

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Wrapper />}>
                    <Route path="/events" element={<ListEvents />} />

                    <Route path="/" element={<Navigate replace to="/events" />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}
