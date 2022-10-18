import { REDIS } from "./redis";
import invariant from "tiny-invariant";
import * as logging from "./loggingSetup";
import { AbortError, commandOptions } from "redis";
import { Logger } from "winston";
import { Action } from "../common/types";

const logger = logging.getLogger("updatesRepo");

export interface EventUpdateMessage {
  id: string;
  type: string;
  payload: string;
  meta: string;
}

export type SpecialMessage = {
  _special: "resync";
  id: string;
};

export type UpdatesMessage = EventUpdateMessage | SpecialMessage;

const UPDATES_STREAM = "eventUpdates";

export async function resync(
  league: string,
  typeName: string,
  eventId: string
) {
  const msg: UpdatesMessage = {
    _special: "resync",
    id: `Event/${league}/${typeName}/${eventId}`,
  };
  const result = await REDIS.xAdd(
    UPDATES_STREAM,
    "*",
    msg as unknown as Record<string, string>
  );
  logger.debug(
    "Dispatched resync of " +
      typeName +
      " " +
      league +
      " " +
      eventId +
      ", its MID is " +
      result
  );
}

export async function dispatchChangeToEvent(
  league: string,
  type: string,
  id: string,
  data: Action
) {
  const msg: UpdatesMessage = {
    id: `Event/${league}/${type}/${id}`,
    type: data.type,
    payload: JSON.stringify(data.payload),
    meta: JSON.stringify(data.meta),
  };
  const result = await REDIS.xAdd(
    UPDATES_STREAM,
    "*",
    msg as unknown as Record<string, string>
  );
  logger.debug("Dispatched change to " + id + ", its MID is " + result);
}

export async function getActions(
  logger: Logger,
  lastMid: string,
  block?: number,
  signal?: AbortSignal
): Promise<Array<{ mid: string; data: UpdatesMessage }> | null> {
  if (process.env.NODE_ENV === "test" && typeof block === "number") {
    // When we disconnect from Redis, it'll wait for all pending blocking commands to exit.
    // The default timeout is high enough that Jest will think it's failed, so override it.
    block = 500;
  }
  logger.debug(
    `Listening to updates with lastMID ${lastMid} and block time ${block}`
  );
  let data;
  try {
    data = await REDIS.xRead(
      commandOptions({
        isolated: typeof block === "number",
        // signal,
      }),
      {
        key: UPDATES_STREAM,
        id: lastMid,
      },
      {
        BLOCK: block,
      }
    );
  } catch (e) {
    if (e instanceof AbortError) {
      return null;
    }
    throw e;
  }
  // TODO: For some reason sometimes Redis returns null in blocking mode, but only in tests.
  if (data === null && process.env.NODE_ENV === "test") {
    data = await REDIS.xRead({ key: UPDATES_STREAM, id: lastMid });
  }
  if (data === null) {
    return null;
  }
  invariant(
    data.length === 1,
    `expected 1 stream's reply from Redis, got ${JSON.stringify(data)}`
  );
  return data[0].messages.map((msg) => {
    logger.debug("Got data", { mid: msg.id });
    const payload = msg.message as unknown as UpdatesMessage;
    return {
      mid: msg.id,
      data: payload,
    };
  });
}
