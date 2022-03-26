import { REDIS } from "./redis";
import invariant from "tiny-invariant";
import { getLogger } from "loglevel";
import { commandOptions } from "redis";

const logger = getLogger("updatesRepo");

export interface UpdatesMessage {
    id: string;
    data: string;
}

const UPDATES_STREAM = "eventUpdates";

export async function dispatchChangeToEvent(id: string, data: any) {
    const msg: UpdatesMessage = {
        id, data: JSON.stringify(data)
    };
    const result = await REDIS.xAdd(UPDATES_STREAM, "*", msg as unknown as Record<string, string>);
    logger.debug("Dispatched change to", id, ", its MID is", result);
}

export async function getEventChanges(lastMid: string, block?: number): Promise<Array<{ mid: string, data: UpdatesMessage }> | null> {
    logger.debug("Listening to updates stream with last MID", lastMid, "and block time", block);
    const data = await REDIS.xRead(commandOptions({
        isolated: typeof block === "number"
    }), {
        key: UPDATES_STREAM,
        id: lastMid
    }, {
        BLOCK: block
    });
    if (data === null) {
        return null;
    }
    invariant(data.length === 1, `expected 1 stream's reply from Redis, got ${JSON.stringify(data)}`);
    return data[0].messages.map(msg => {
        const payload = msg.message as unknown as UpdatesMessage;
        return {
            mid: msg.id,
            data: payload
        };
    });
}
