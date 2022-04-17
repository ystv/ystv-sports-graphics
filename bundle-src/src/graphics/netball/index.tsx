import { useOnlyReplicantValue } from "common/useReplicant";
import type { State } from "@ystv/scores/src/common/sports/netball";
import { ControlNetball } from "common/types/control-netball";
import { GraphicContainer } from "../common/container";
import { NetballSmallScore } from "./SmallScore";

export function AllNetballGraphics() {
  const state = useOnlyReplicantValue<State>("eventState");
  const control = useOnlyReplicantValue<ControlNetball>("control-netball");

  if (!state || !control) {
    return null;
  }

  return (
    <>
      <GraphicContainer>
        <NetballSmallScore control={control} value={state} />
      </GraphicContainer>
    </>
  );
}
