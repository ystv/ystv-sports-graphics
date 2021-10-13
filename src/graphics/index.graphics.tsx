import ReactDOM from "react-dom";
import React from "react";
import { useOnlyReplicantValue } from "common/useReplicant";
import { Scoreboard } from "./rugby/Scoreboard/Scoreboard";
import "./global.css";
import { Lineup } from "./rugby/Lineup/Lineup";

function AllGraphics() {
  const name = useOnlyReplicantValue("name", undefined, { defaultValue: "" });
  const show = useOnlyReplicantValue("show", undefined, {
    defaultValue: false,
  });
  return (
    <>
      <GraphicContainer>
        <Scoreboard isVisible={show} isTimerShown={show} />
      </GraphicContainer>
      <GraphicContainer>
        <Lineup isVisible={show} />
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
