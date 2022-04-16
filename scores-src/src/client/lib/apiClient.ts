import type { InferType } from "yup";
import type { BaseEvent, User } from "../../common/types";
import { stringify } from "qs";
import { createContext, createRef, useContext, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import logging from "loglevel";
import { NavigateFunction, useNavigate } from "react-router-dom";
// import type { User } from "../../server/auth";
const logger = logging.getLogger("apiClient");

const TOKEN_KEY = "SportsScoresToken";

export function getAuthToken(): string | null {
  return JSON.parse(sessionStorage.getItem(TOKEN_KEY) ?? "null");
}

export function setAuthToken(tokenVal: string | null) {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokenVal));
}

function setHeader(req: RequestInit, key: string, value: string) {
  if (Array.isArray(req.headers)) {
    req.headers.push([key, value]);
  } else if (req.headers instanceof Headers) {
    req.headers.set(key, value);
  } else if (req.headers) {
    req.headers[key] = value;
  } else {
    req.headers = { [key]: value };
  }
}

const fetcher =
  (navigate: NavigateFunction) =>
  (endpoint: string, req?: RequestInit, expectedStatus?: number) => {
    req = req || {};
    setHeader(req, "Accept", "application/json");
    setHeader(req, "X-Requested-With", "fetch");

    const token = getAuthToken();
    if (token !== null) {
      setHeader(req, "Authorization", `Bearer ${token}`);
    }

    return fetch(
      (import.meta.env.PUBLIC_API_BASE || "/api") + endpoint,
      req
    ).then(async (res) => {
      logger.info(endpoint, "status", res.status, "expected", expectedStatus);
      if (typeof expectedStatus === "number") {
        if (res.status !== expectedStatus) {
          logger.warn(
            `Received unexpected status ${res.status} from ${endpoint} (expected ${expectedStatus})`
          );
          if (res.status === 401) {
            navigate("/login");
            return;
          }
          const up = new Error(`Unexpected status ${res.status}`);
          // @ts-expect-error assigning to errors is fine
          up.status = res.status;
          try {
            const data = await res.json();
            if ("needsBootstrap" in data && data.needsBootstrap) {
              // Redirect to the /bootstrap screen
              navigate("/bootstrap");
              return;
            }
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
    });
  };

type AnyObject = Record<string, unknown>;

function useAPIRoute<TRes, TParams extends AnyObject | AnyObject[] = AnyObject>(
  endpoint: string,
  payload?: TParams,
  expectedStatus?: number
) {
  const navigate = useNavigate();
  let path = endpoint;
  if (typeof payload !== "undefined") {
    path += stringify(payload, { addQueryPrefix: true });
  }
  const { data, error } = useSWR(path, () =>
    fetcher(navigate)(path, undefined, expectedStatus)
  );

  return {
    data: data as TRes,
    error,
    loading: !data && !error,
  };
}

export function useGETEvents() {
  const retval = useAPIRoute<InferType<typeof BaseEvent>[]>("/events", {}, 200);
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
  const navigate = useNavigate();

  return async (type: string, data: InferType<typeof BaseEvent>) => {
    const result = (await fetcher(navigate)(
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
  const navigate = useNavigate();

  return async (
    type: string,
    id: string,
    data: InferType<typeof BaseEvent>
  ) => {
    const result = (await fetcher(navigate)(
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
  const navigate = useNavigate();

  return async (
    type: string,
    id: string,
    actionType: string,
    data: Record<string, unknown>
  ) => {
    const result = (await fetcher(navigate)(
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

export function useGETBootstrapReady() {
  const retval = useAPIRoute<{ ok: true; ready: boolean | "waiting" }>(
    "/bootstrap/ready",
    {},
    200
  );
  return retval;
}

export function usePOSTBootstrapCheckToken() {
  const navigate = useNavigate();

  return async (token: string) => {
    const result = (await fetcher(navigate)(
      `/bootstrap/checkToken`,
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      },
      200
    )) as { ok: boolean; valid: boolean };
    return result.valid;
  };
}

export function usePOSTBootstrap() {
  const navigate = useNavigate();

  return async (token: string, username: string, password: string) => {
    (await fetcher(navigate)(
      `/bootstrap/bootstrap`,
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, username, password }),
      },
      200
    )) as { ok: boolean };
  };
}

export function usePOSTLogin() {
  const navigate = useNavigate();

  return async (username: string, password: string) => {
    const result = (await fetcher(navigate)(
      `/auth/login/local`,
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      },
      200
    )) as { ok: true; user: User; token: string };
    return result;
  };
}
