import { Button, ButtonGroup, Card, Col, Row } from "react-bootstrap";
import { Link, Outlet } from "react-router-dom";
import { useGETEvents } from "../lib/apiClient";

export function ListEvents() {
  const { data: events, loading, error } = useGETEvents();

  if (loading) {
    return (
      <div>
        <h1>Loading, please to waiting...</h1>
      </div>
    );
  }

  if (error) {
    console.log(error);
    return (
      <div>
        <h1>Oopsie woopsie owo we made a fucky wucky!</h1>
        <code>{JSON.stringify(error)}</code>
      </div>
    );
  }

  return (
    <Row>
      <h1>All Events</h1>
      <Col xs="2">
        {/* @ts-expect-error */}
        <Button as={Link} to="new">
          Create New
        </Button>
      </Col>
      {events.map((evt) => (
        <Card key={evt.id}>
          <Card.Header>
            <h2>{evt.name}</h2>
          </Card.Header>
          <Card.Footer>
            <ButtonGroup>
              {/* @ts-expect-error */}
              <Button as={Link} to={`${evt.type}/${evt.id}/edit`}>
                Edit
              </Button>
              {/* @ts-expect-error */}
              <Button as={Link} to={`${evt.type}/${evt.id}`} variant="info">
                Live Scores
              </Button>
            </ButtonGroup>
          </Card.Footer>
        </Card>
      ))}
      <Outlet />
    </Row>
  );
}
