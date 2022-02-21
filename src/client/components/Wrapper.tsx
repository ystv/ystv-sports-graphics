import { Outlet } from "react-router-dom";

export function Wrapper() {
    return (
        <div>
            <Outlet />
        </div>
    )
}