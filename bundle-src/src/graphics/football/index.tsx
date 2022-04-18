import { useOnlyReplicantValue } from "common/useReplicant";
import type { ValueType } from "@ystv/scores/src/common/sports/netball";
import { ControlNetball } from "common/types/control-netball";
import { GraphicContainer } from "../common/container";

export default function Football() {
  const state = useOnlyReplicantValue<ValueType>("eventState");
  const control = useOnlyReplicantValue<ControlNetball>("control-netball");

  if (!state || !control) {
    return null;
  }

  return (
    <>
      <GraphicContainer>
        <></>
      </GraphicContainer>
    </>
  );
}
