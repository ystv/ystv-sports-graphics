import ReactDOM from "react-dom";
import React from "react";
import { useOnlyReplicantValue } from "common/useReplicant";
import { Name } from "./Name";
import { Scoreboard } from "./rugby/Scoreboard";
import "./global.css";

function AllGraphics() {
  const name = useOnlyReplicantValue("name", undefined, { defaultValue: "" });
  return (
    <>
      {/* <GraphicContainer>
        <h1 style={{ color: "red" }}>This is the graphics, but React.</h1>
        <Name name={name || ""} />
      </GraphicContainer> */}
      <GraphicContainer>
        <Scoreboard />
      </GraphicContainer>
    </>
  );
}

function GraphicContainer({
  zIndex = 0,
  children,
}: {
  zIndex?: number;
  children: JSX.Element | JSX.Element[];
}) {
  const styles: React.CSSProperties = {
    position: "absolute",
    top: 0,
    height: "100%",
    width: "100%",
    zIndex: zIndex,
  };
  return <div style={styles}>{children}</div>;
}

ReactDOM.render(<AllGraphics />, document.getElementById("root"));
