import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { EVENTS } from "../eventTypes";
import { useLiveData } from "../lib/liveData";
import invariant from "tiny-invariant";
import { Alert, Button } from "react-bootstrap";

export function LiveScores() {
  const { type, id } = useParams();
  invariant(typeof type === "string", "no type");
  invariant(typeof id === "string", "no id");
  const [data, ready, error] = useLiveData(`Event/${type}/${id}`);
  const RenderScore = EVENTS[type!].RenderScore;
  const actions = EVENTS[type].actions;

  if (!ready) {
    if (error != null) {
      return <Alert variant="danger">{error}</Alert>;
    }
    return (
      <div>
        <b>Connecting to server, please wait...</b>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <b>Loading data from server, please wait...</b>
      </div>
    );
  }

  return (
    <>
      {error !== null && <Alert variant="warning">{error}</Alert>}
      <RenderScore
        value={data}
        actions={
          <>
            {Object.keys(actions).map((actionType) => (
              <Button key={actionType}>{actionType}</Button>
            ))}
          </>
        }
      />
    </>
  );
}
