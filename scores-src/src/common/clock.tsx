import * as Yup from "yup";

/** An upward clock starts from zero and counts up infinitely. */
export const UpwardClock = Yup.object({
  type: Yup.mixed<"upward">().required().equals(["upward"]).default("upward"),
  state: Yup.mixed<"running" | "stopped">()
    .oneOf(["running", "stopped"])
    .required()
    .default("stopped"),
  wallClockLastStarted: Yup.number().required().default(0),
  timeLastStartedOrStopped: Yup.number().required().default(0),
}).required();

/** A downward clock starts at `startingTime` and counts down to zero. */
export const DownwardClock = Yup.object({
  type: Yup.mixed<"downward">()
    .required()
    .equals(["downward"])
    .default("downward"),
  state: Yup.mixed<"running" | "stopped">()
    .oneOf(["running", "stopped"])
    .required()
    .default("stopped"),
  wallClockLastStarted: Yup.number().required().default(0),
  timeLastStartedOrStopped: Yup.number().required().default(0),
  startingTime: Yup.number().required(),
}).required();

export type DownwardClockType = Yup.InferType<typeof DownwardClock>;

export type ClockType =
  | Yup.InferType<typeof UpwardClock>
  | Yup.InferType<typeof UpwardClock>;

function isDownward(clock: ClockType): clock is DownwardClockType {
  return clock.type === "downward";
}

export function currentTime(clock: ClockType): number {
  return clockTimeAt(clock, new Date().valueOf());
}

export function clockTimeAt(clock: ClockType, wallClock: number): number {
  if (clock.state === "stopped") {
    return clock.timeLastStartedOrStopped;
  }
  switch (clock.type) {
    case "downward":
      console.log("YEET", {
        ...clock,
        wallClock,
      });
      return Math.max(
        clock.timeLastStartedOrStopped -
          (wallClock - clock.wallClockLastStarted),
        0
      );
    case "upward":
      return (
        clock.timeLastStartedOrStopped +
        (wallClock - clock.wallClockLastStarted)
      );
    default:
      throw new Error("unexpected clock direction: " + clock.type);
  }
}

export function startClockNow(clock: ClockType, countDownFrom?: number) {
  startClockAt(clock, new Date().valueOf(), countDownFrom);
}

export function startClockAt(
  clock: ClockType,
  wallClock: number,
  countDownFrom?: number
) {
  clock.state = "running";
  clock.wallClockLastStarted = wallClock;
  if (typeof countDownFrom === "number" && isDownward(clock)) {
    clock.timeLastStartedOrStopped = countDownFrom;
    clock.startingTime = countDownFrom;
  }
}

export function stopClock(clock: ClockType) {
  clock.timeLastStartedOrStopped = currentTime(clock);
  clock.state = "stopped";
}

export function formatMMSSMS(
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
    const h = Math.floor(time / (1000 * 60 * 60));
    str = h.toFixed(0).padStart(2, "0") + ":" + str;
  }

  return str;
}
