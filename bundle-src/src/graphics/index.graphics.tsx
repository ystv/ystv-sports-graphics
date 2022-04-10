import ReactDOM from "react-dom";
import React from "react";
import { BaseEventType } from "@ystv/scores/src/common/types";
import { useOnlyReplicantValue } from "common/useReplicant";

const SportGraphics: Record<string, React.ComponentType> = {};

function AllGraphics() {
  const state = useOnlyReplicantValue<BaseEventType>("eventState");
  if (!state) {
    return null;
  }
  const Graphic = SportGraphics[state.type as any];
  if (!Graphic) {
    return null;
  }
  return <Graphic />;
}

ReactDOM.render(<AllGraphics />, document.getElementById("root"));
