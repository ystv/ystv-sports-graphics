import { Container, Nav } from "react-bootstrap";
import { Outlet, NavLink, NavLinkProps } from "react-router-dom";
import { Navbar } from "react-bootstrap";

function NavbarLink(props: NavLinkProps) {
  return (
    <NavLink {...props} className="nav-link">
      {props.children}
    </NavLink>
  );
}

export function Wrapper() {
  return (
    <>
      <Navbar expand="lg">
        <Container>
          <Navbar.Brand>YSTV Sports Scores</Navbar.Brand>
          <Navbar.Toggle aria-controls="topNav" />
          <Navbar.Collapse id="topNav">
            <Nav className="me-auto">
              <NavbarLink to="/events">Events</NavbarLink>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container>
        <Outlet />
      </Container>
    </>
  );
}
