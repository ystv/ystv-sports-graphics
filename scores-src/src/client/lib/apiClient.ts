import type { InferType } from "yup";
import type { BaseEvent } from "../../common/types";
import { stringify } from "qs";
import { createContext, useContext, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import logging from "loglevel";
const logger = logging.getLogger("apiClient");

const fetcher = (
  endpoint: string,
  req?: RequestInit,
  expectedStatus?: number
) =>
  fetch((import.meta.env.PUBLIC_API_BASE || "/api") + endpoint, req).then(
    async (res) => {
      logger.info("Status", res.status, "expected", expectedStatus);
      if (typeof expectedStatus === "number") {
        if (res.status !== expectedStatus) {
          logger.warn(
            `Received unexpected status ${res.status} from ${endpoint} (expected ${expectedStatus})`
          );
          const up = new Error(`Unexpected status ${res.status}`) as any;
          up.status = res.status;
          try {
            const data = await res.json();
            if ("error" in data) {
              up.message = data.error;
            }
          } catch (e) {
            logger.warn("Failed to get error info for status", res.status, e);
          }
          throw up; // ha ha
        }
      }

      // If there's no expectedStatus set, but there's an error from the API,
      // pass it on to the caller (since they may expect it), but log it just
      // in case.
      const data = await res.json();
      if ("error" in data) {
        logger.warn(`Received error from API ${endpoint}:`, data.error);
      }
      return data;
    }
  );

function useAPIRoute<TRes, TParams extends {} | any[] = {}>(
  endpoint: string,
  payload?: TParams,
  expectedStatus?: number
) {
  let path = endpoint;
  if (typeof payload !== "undefined") {
    path += stringify(payload, { addQueryPrefix: true });
  }
  const { data, error } = useSWR(path, () =>
    fetcher(path, undefined, expectedStatus)
  );

  return {
    data: data as TRes,
    error,
    loading: !data && !error,
  };
}

export function useGETEvents() {
  const retval = useAPIRoute<InferType<typeof BaseEvent>[]>("/events", {}, 200);
  console.log(retval);

  return retval;
}

export function useGETEvent(type: string, id: string) {
  const retval = useAPIRoute<InferType<typeof BaseEvent>>(
    `/events/${type}/${id}`,
    {},
    200
  );

  return retval;
}

export function usePOSTEvents() {
  const { mutate } = useSWRConfig();

  return async (type: string, data: InferType<typeof BaseEvent>) => {
    const result = (await fetcher(
      "/events/" + type,
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      201
    )) as InferType<typeof BaseEvent>;
    mutate("/events");
    mutate(`/events/${result.type}/${result.id}`, result, false);
    return result;
  };
}

export function usePUTEvent() {
  const { mutate } = useSWRConfig();

  return async (
    type: string,
    id: string,
    data: InferType<typeof BaseEvent>
  ) => {
    const result = (await fetcher(
      `/events/${type}/${id}`,
      {
        method: "put",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      200
    )) as InferType<typeof BaseEvent>;
    mutate("/events");
    mutate(`/events/${type}/${result.id}`, result, false);
    return result;
  };
}

export function usePOSTEventAction() {
  const { mutate } = useSWRConfig();

  return async (
    type: string,
    id: string,
    actionType: string,
    data: Record<string, any>
  ) => {
    const result = (await fetcher(
      `/events/${type}/${id}/${actionType}`,
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      200
    )) as InferType<typeof BaseEvent>;
    mutate("/events");
    mutate(`/events/${type}/${result.id}`, result, false);
    return result;
  };
}
