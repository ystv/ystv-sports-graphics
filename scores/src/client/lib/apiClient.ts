import type { InferType } from "yup";
import type { BaseEvent } from "../../common/types";
import { stringify } from "qs";
import { createContext, useContext, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";

const fetcher = (endpoint: string, req?: RequestInit, expectedStatus?: number) => fetch((import.meta.env.PUBLIC_API_BASE || "/api") + endpoint, req)
    .then(async res => {
        if (typeof expectedStatus === "number") {
            if (res.status !== expectedStatus) {
                const up = new Error(`Unexpected status ${res.status}: ${(await res.json()).error}`);
                throw up;
            }
        }
        return await res.json();
    }).then(data => {
    if ("error" in data) {
        throw new Error(data.error);
    }
    return data;
})

function useAPIRoute<TRes, TParams extends {} | any[] = {}>(endpoint: string, payload?: TParams) {
    let path = endpoint;
    if (typeof payload !== "undefined") {
        path += stringify(payload, { addQueryPrefix: true });
    }
    const {data, error} = useSWR(path, () => fetcher(path));

    return {
        data: data as TRes,
        error,
        loading: !data && !error
    };
}

export function useGETEvents() {
    const retval = useAPIRoute<InferType<typeof BaseEvent>[]>("/events");

    return retval;
}

export function useGETEvent(type: string, id: string) {
    const retval = useAPIRoute<InferType<typeof BaseEvent>>(`/events/${type}/${id}`);

    return retval;
}

export function usePOSTEvents() {
    const { mutate } = useSWRConfig();

    return async (type: string, data: InferType<typeof BaseEvent>) => {
        const result = await fetcher("/events/" + type, {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }, 201) as InferType<typeof BaseEvent>;
        mutate("/events");
        mutate(`/events/${result.type}/${result.id}`, result, false);
        return result;
    }
}

export function usePUTEvent() {
    const { mutate } = useSWRConfig();

    return async (type: string, id: string, data: InferType<typeof BaseEvent>) => {
        const result = await fetcher(`/events/${type}/${id}`, {
            method: "put",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }, 200) as InferType<typeof BaseEvent>;
        mutate("/events");
        mutate(`/events/${type}/${result.id}`, result, false);
        return result;
    }
}

export function usePOSTEventAction() {
    const { mutate } = useSWRConfig();

    return async (type: string, id: string, actionType: string, data: Record<string, any>) => {
        const result = await fetcher(`/events/${type}/${id}/${actionType}`, {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }, 200) as InferType<typeof BaseEvent>;
        mutate("/events");
        mutate(`/events/${type}/${result.id}`, result, false);
        return result;
    }
}
