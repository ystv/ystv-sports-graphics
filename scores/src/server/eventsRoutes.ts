import Router from "koa-router";
import { DB } from "./db";

export function createEventsRouter() {
    const router = new Router({prefix: "/events"});

    router.get("/", async (ctx) => {
        const result = await DB.query(
            `SELECT RAW e FROM _default e WHERE meta(e).id LIKE 'Event/%'`
        );
        ctx.response.body = JSON.stringify(result.rows);
    })

    return router;
}
