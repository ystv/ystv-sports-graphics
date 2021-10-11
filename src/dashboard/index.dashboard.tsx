import React from "react";
import ReactDOM from "react-dom";
import { useReplicantValue } from "common/useReplicant";

function Dashboard() {
  const [name, setName] = useReplicantValue("name", undefined, {
    defaultValue: "",
  });
  const [show, setShow] = useReplicantValue("show", undefined, {
    defaultValue: false,
  });
  return (
    <>
      <label>
        Name
        <input
          type="text"
          value={name || ""}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Show
        <input
          type="checkbox"
          checked={show || false}
          onChange={(e) => setShow(e.target.checked)}
        />
      </label>
    </>
  );
}

ReactDOM.render(<Dashboard />, document.getElementById("root"));
