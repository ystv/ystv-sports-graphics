import ReactDOM from "react-dom";
import React from "react";
import { AllNetballGraphics } from "./netball";
import { AllFootballGraphics } from "./football";
import { BaseEventType } from "@ystv/scores/src/common/types";
import { useOnlyReplicantValue } from "common/useReplicant";
import { EventID } from "common/types/eventID";

import "./global.css";
import { AllBasketballGraphics } from "./basketball";

const SportGraphics: Record<string, React.ComponentType> = {
  netball: AllNetballGraphics,
  football: AllFootballGraphics,
  basketball: AllBasketballGraphics,
};

function AllGraphics() {
  const id = useOnlyReplicantValue<EventID>("eventID");
  const state = useOnlyReplicantValue<BaseEventType>("eventState");
  if (!state || !id) {
    return null;
  }

  const [_, type] = id.split("/");

  const Graphic = SportGraphics[type];
  if (!Graphic) {
    console.warn("No graphic for event type", type);
    return null;
  }
  return <Graphic />;
}

ReactDOM.render(<AllGraphics />, document.getElementById("root"));
