import { useOnlyReplicantValue } from "common/useReplicant";
import type { ValueType } from "@ystv/scores/src/common/sports/netball";
import { ControlNetball } from "common/types/control-netball";
import { GraphicContainer } from "../common/container";
import { NetballSmallScore } from "./SmallScore";

export function AllNetballGraphics() {
  const state = useOnlyReplicantValue<ValueType>("eventState");
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
