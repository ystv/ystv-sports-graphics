import { useState, useEffect } from "react";
import { ClockType, currentTime, formatMMSSMS } from "../clock";

export function RenderClock({
  clock,
  precisionMs,
  precisionHigh,
}: {
  clock: ClockType;
  precisionMs: number;
  precisionHigh: number;
}) {
  const [time, setTime] = useState(() => currentTime(clock));
  useEffect(() => {
    if (clock.state === "stopped") {
      setTime(currentTime(clock));
      return;
    }
    function tick() {
      setTime(currentTime(clock));
    }
    const interval = setInterval(tick, 20);
    return () => clearInterval(interval);
  }, [clock.state]);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {formatMMSSMS(time, precisionMs, precisionHigh)}
    </span>
  );
}
