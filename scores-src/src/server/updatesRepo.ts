import { REDIS } from "./redis";
import invariant from "tiny-invariant";
import * as logging from "./loggingSetup";
import { AbortError, commandOptions } from "redis";
import { Logger } from "winston";
import { Action } from "../common/eventStateHelpers";

const logger = logging.getLogger("updatesRepo");

export interface UpdatesMessage {
  id: string;
  type: string;
  payload: string;
  meta: string;
}

const UPDATES_STREAM = "eventUpdates";

export async function dispatchChangeToEvent(id: string, data: Action) {
  const msg: UpdatesMessage = {
    id,
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
  logger.debug(
    `Listening to updates with lastMID ${lastMid} and block time ${block}`
  );
  let data;
  try {
    data = await REDIS.xRead(
      commandOptions({
        isolated: typeof block === "number",
        signal,
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
  if (data === null) {
    return null;
  }
  invariant(
    data.length === 1,
    `expected 1 stream's reply from Redis, got ${JSON.stringify(data)}`
  );
  return data[0].messages.map((msg) => {
    const payload = msg.message as unknown as UpdatesMessage;
    return {
      mid: msg.id,
      data: payload,
    };
  });
}
