import * as Yup from "yup";
import Router from "koa-router";
import { DB } from "./db";
import { v4 as uuidv4 } from "uuid";
import { DocumentExistsError } from "couchbase";
import { EventActionFunctions, EventActionTypes } from "../common/types";
import { REDIS } from "./redis";
import { dispatchChangeToEvent } from "./updatesRepo";

export function makeEventAPI<TEventSchema extends Yup.AnyObjectSchema, TActions extends EventActionTypes>(
    typeName: string,
    schema: TEventSchema,
    actionTypes: TActions,
    actionFuncs: EventActionFunctions<TEventSchema, TActions>) {
    const router = new Router({ prefix: `/events/${typeName}` });

    const key = (id: string) => `Event/${typeName}/${id}`;

    router.get("/", async (ctx) => {
        const result = await DB.query(
            `SELECT RAW e FROM _default e WHERE meta(e).id LIKE 'Event/${typeName}/%'`
        );
        ctx.response.body = JSON.stringify(result.rows);
    });

    router.get("/:id", async (ctx) => {
        const id = ctx.params.id;
        const data = await DB.collection("_default").get(key(id));
        ctx.response.body = JSON.stringify(data.content);
    });

    router.post("/", async (ctx) => {
        if (!ctx.is("application/json")) {
            ctx.throw(406);
        }
        const data = ctx.request.body;
        const val: Yup.InferType<TEventSchema> = await schema.omit(["id", "type"]).validate(data, { abortEarly: false });
        val.type = typeName;
        while (true) {
            try {
                val.id = uuidv4();
                await DB.collection("_default").insert(key(val.id), val);
                break;
            } catch (e) {
                if (e instanceof DocumentExistsError) {
                    continue;
                }
                throw e;
            }
        }
        await dispatchChangeToEvent(key(val.id), val);
        ctx.response.body = JSON.stringify(val);
        ctx.response.status = 201;
    });

    router.put("/:id", async (ctx) => {
        if (!ctx.is("application/json")) {
            ctx.throw(406);
        }
        const id = ctx.params.id;
        const data = await DB.collection("_default").get(key(id));
        const inputData = ctx.request.body;
        const val: Yup.InferType<TEventSchema> = await schema.omit(["id", "type"]).validate(inputData, { abortEarly: false, stripUnknown: true });
        const result = Object.assign({}, data.content, val);
        await DB.collection("_default").replace(
            key(id),
            result
        );
        await dispatchChangeToEvent(key(id), result);
        ctx.response.body = JSON.stringify(result);
    });
    
    for (const action of Object.keys(actionTypes)) {
        router.post(`/:id/${action}`, async (ctx) => {
            if (!ctx.is("application/json")) {
                ctx.throw(406);
            }
            const data: Yup.InferType<TActions[typeof action]> = await actionTypes[action].validate(ctx.request.body, { abortEarly: false, stripUnknown: true });
            const result = await DB.collection("_default").get(key(ctx.params.id));
            let val = result.content;
            actionFuncs[action](val, data);
            await DB.collection("_default").replace(key(ctx.params.id), val, { cas: result.cas });
            await dispatchChangeToEvent(key(ctx.params.id), val);
            ctx.response.body = JSON.stringify(val);
        });
    }

    return router;
}
