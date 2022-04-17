import { useState, useEffect } from "react";
import { ClockType, clockTimeAt, formatMMSSMS } from "../clock";
import { Text, Title } from "@mantine/core";

export function RenderClock({
  clock,
  precisionMs,
  precisionHigh,
}: {
  clock: ClockType;
  precisionMs: number;
  precisionHigh: number;
}) {
  const [time, setTime] = useState(() =>
    clockTimeAt(clock, new Date().valueOf())
  );
  useEffect(() => {
    if (clock.state === "stopped") {
      setTime(clockTimeAt(clock, new Date().valueOf()));
    }
    function tick() {
      setTime(clockTimeAt(clock, new Date().valueOf()));
    }
    const interval = setInterval(tick, 20);
    return () => clearInterval(interval);
  }, [clock.state]);
  return (
    <Title order={3} style={{ fontVariantNumeric: "tabular-nums" }}>
      {formatMMSSMS(time, precisionMs, precisionHigh)}
    </Title>
  );
}
