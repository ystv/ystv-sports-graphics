import * as Yup from "yup";
import { DB } from "./db";
import { v4 as uuidv4 } from "uuid";
import { Router } from "express";
import asyncHandler from "express-async-handler";
import { PreconditionFailed } from "http-errors";
import { DocumentExistsError } from "couchbase";
import { EventActionFunctions, EventActionTypes } from "../common/types";
import { REDIS } from "./redis";
import { dispatchChangeToEvent } from "./updatesRepo";

export function makeEventAPI<
  TEventSchema extends Yup.AnyObjectSchema,
  TActions extends EventActionTypes<TEventSchema>
>(
  typeName: string,
  schema: TEventSchema,
  actionTypes: TActions,
  actionFuncs: EventActionFunctions<TEventSchema, TActions>
) {
  const router = Router();

  const key = (id: string) => `Event/${typeName}/${id}`;

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const result = await DB.query(
        `SELECT RAW e FROM _default e WHERE meta(e).id LIKE 'Event/${typeName}/%'`
      );
      res.json(result.rows);
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const data = await DB.collection("_default").get(key(id));
      res.json(data.content);
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const val: Yup.InferType<TEventSchema> = await schema
        .omit(["id", "type"])
        .validate(req.body, { abortEarly: false });
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
      res.statusCode = 201;
      res.json(val);
    })
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const data = await DB.collection("_default").get(key(id));
      const inputData = req.body;
      const val: Yup.InferType<TEventSchema> = await schema
        .omit(["id", "type"])
        .validate(inputData, { abortEarly: false, stripUnknown: true });
      const result = Object.assign({}, data.content, val);
      await DB.collection("_default").replace(key(id), result);
      await dispatchChangeToEvent(key(id), result);
      res.json(result);
    })
  );

  for (const action of Object.keys(actionTypes)) {
    router.post(
      `/:id/${action}`,
      asyncHandler(async (req, res) => {
        const data: Yup.InferType<TActions[typeof action]["schema"]> =
          await actionTypes[action].schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
          });
        const result = await DB.collection("_default").get(key(req.params.id));
        let val = result.content;

        const validFn = actionTypes[action].valid;
        if (typeof validFn === "function") {
          if (!validFn(val)) {
            throw new PreconditionFailed("action not valid at this time");
          }
        }

        actionFuncs[action](val, data);
        await DB.collection("_default").replace(key(req.params.id), val, {
          cas: result.cas,
        });
        await dispatchChangeToEvent(key(req.params.id), val);
        res.json(val);
      })
    );
  }

  return router;
}
