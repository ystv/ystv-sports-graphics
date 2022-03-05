import { useEffect, useRef, useState } from "react";
import * as Yup from "yup";

export const Clock = Yup.object({
  state: Yup.string()
    .oneOf(["running", "stopped"])
    .required()
    .default("stopped"),
  wallClockLastStarted: Yup.number().required().default(0),
  timeLastStartedOrStopped: Yup.number().required().default(0),
}).required();

export type ClockType = Yup.InferType<typeof Clock>;

export function currentTime(clock: ClockType): number {
  if (clock.state === "stopped") {
    return clock.timeLastStartedOrStopped;
  }
  return (
    clock.timeLastStartedOrStopped +
    (new Date().valueOf() - clock.wallClockLastStarted)
  );
}

export function startClock(clock: ClockType) {
  clock.state = "running";
  clock.wallClockLastStarted = new Date().valueOf();
}

export function stopClock(clock: ClockType) {
  clock.timeLastStartedOrStopped = currentTime(clock);
  clock.state = "stopped";
}

function formatMMSSMS(
  time: number,
  precisionMs = 2,
  precisionHigh = 2
): string {
  let str = "";

  if (precisionMs > 0) {
    const ms = (time % 1000) / 10 ** (3 - precisionMs);
    str = ":" + ms.toFixed(0).padStart(precisionMs, "0");
  }

  if (precisionHigh >= 1) {
    let s = Math.floor(time / 1000);
    if (precisionHigh > 1) {
      s = s % 60;
    }
    str = s.toFixed(0).padStart(2, "0") + str;
  }

  if (precisionHigh >= 2) {
    let m = Math.floor(time / (1000 * 60));
    if (precisionHigh > 2) {
      m = m % 60;
    }
    str = m.toFixed(0).padStart(2, "0") + ":" + str;
  }

  if (precisionHigh >= 3) {
    let h = Math.floor(time / (1000 * 60 * 60));
    str = h.toFixed(0).padStart(2, "0") + ":" + str;
  }

  return str;
}

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
