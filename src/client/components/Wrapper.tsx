import { Container } from "react-bootstrap";
import { Outlet } from "react-router-dom";

export function Wrapper() {
    return (
        <Container>
            <Outlet />
        </Container>
    )
}