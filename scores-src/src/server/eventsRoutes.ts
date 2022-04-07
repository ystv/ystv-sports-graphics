import { Router } from "express";
import { DB } from "./db";

export function createEventsRouter() {
    const router = Router();

    router.get("/", async (req, res) => {
        const result = await DB.query(
            `SELECT RAW e FROM _default e WHERE meta(e).id LIKE 'Event/%'`
        );
        res.json(result.rows);
    })

    return router;
}
