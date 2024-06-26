import ReactDOM from "react-dom";
import React from "react";
import { AllNetballGraphics } from "./netball";
import { AllFootballGraphics } from "./football";
import { EventMeta } from "@ystv/scores/src/common/types";
import { useOnlyReplicantValue } from "common/useReplicant";
import { EventID } from "common/types/eventID";

import "./global.css";
import { AllBasketballGraphics } from "./basketball";
import { AllLacrosseGraphics } from "./lacrosse";
import { AllUltimateGraphics } from "./ultimate";
import { AllWaterpoloGraphics } from "./waterpolo";
import { AllRugbyUnionGraphics } from "./rugby";
import { AllAmericanFootballGraphics } from "./americanFootball";
import { AlLBadmintonGraphics } from "./badminton";
import { AllCanoePoloGraphics } from "./canoePolo";
import { AllFutsalGraphics } from "./futsal";
import { AllHandballGraphics } from "./handball";
import { AllTableTennisGraphics } from "./tableTennis";
import { AllVolleyballGraphics } from "./volleyball";
import { AllHockeyGraphics } from "./hockey";
import { AllSwimmingGraphics } from "./swimming";
import { AllKorfballGraphics } from "./korfball";
import { AllOctopushGraphics } from "./octopush";
import { AllRosesFencingGraphics } from "./rosesFencing";

const SportGraphics: Record<string, React.ComponentType> = {
  netball: AllNetballGraphics,
  football: AllFootballGraphics,
  basketball: AllBasketballGraphics,
  lacrosse: AllLacrosseGraphics,
  ultimate: AllUltimateGraphics,
  waterpolo: AllWaterpoloGraphics,
  hockey: AllHockeyGraphics,
  rugbyUnion: AllRugbyUnionGraphics,
  americanFootball: AllAmericanFootballGraphics,
  badminton: AlLBadmintonGraphics,
  canoePolo: AllCanoePoloGraphics,
  futsal: AllFutsalGraphics,
  handball: AllHandballGraphics,
  tableTennis: AllTableTennisGraphics,
  volleyball: AllVolleyballGraphics,
  swimming: AllSwimmingGraphics,
  korfball: AllKorfballGraphics,
  octopush: AllOctopushGraphics,
  rosesFencing: AllRosesFencingGraphics,
};

function AllGraphics() {
  const id = useOnlyReplicantValue<EventID>("eventID");
  const state = useOnlyReplicantValue<EventMeta>("eventState");
  if (!state || !id) {
    return null;
  }

  const [_, _league, type] = id.split("/");

  const Graphic = SportGraphics[type];
  if (!Graphic) {
    console.warn("No graphic for event type", type);
    return null;
  }
  return <Graphic />;
}

ReactDOM.render(<AllGraphics />, document.getElementById("root"));
