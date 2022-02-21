import type { InferType } from "yup";
import type { BaseEvent } from "../../common/types";
import { stringify } from "qs";
import { createContext, useContext } from "react";
import useSWR from "swr";

const fetcher = (url: string, init: RequestInit) => fetch(url, init).then(res => res.json())

function useAPIRoute<TRes, TParams extends {} | any[] = {}>(endpoint: string, payload?: TParams) {
    let path = "/api" + endpoint;
    if (typeof payload !== "undefined") {
        path += stringify(payload, { addQueryPrefix: true });
    }
    const {data, error} = useSWR(path, () => fetch((import.meta.env.PUBLIC_API_BASE || "") + path).then(res => res.json()));

    return {
        data: data as TRes,
        error,
        loading: !data && !error
    };
}

export function useGETEvents() {
    return useAPIRoute<InferType<typeof BaseEvent>[]>("/events");
}
