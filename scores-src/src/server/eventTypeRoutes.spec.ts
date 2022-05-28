/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import { hash } from "argon2";
import cookieParser from "cookie-parser";
import request from "supertest";
import { json as jsonParser } from "body-parser";
import Express, { Application, NextFunction, Router } from "express";
import { BaseEventType, EventTypeInfo } from "../common/types";
import { createEventsRouter } from "./eventsRoutes";
import { errorHandler } from "./httpUtils";
import { getLogger } from "./loggingSetup";
import { InMemoryDB } from "./__mocks__/db";
import { createEventTypesRouter } from "./eventTypeRoutes";
import { EVENT_TYPES } from "../common/sports";
import { wrapAction, Init, Undo } from "../common/eventStateHelpers";

jest.mock("./db");
jest.mock("./redis");
jest.mock("./updateTournamentSummary.job");

function runTests<
  TActions extends { [K: string]: (payload?: any) => { type: string } },
  TInfo extends EventTypeInfo<BaseEventType, TActions>
>(
  typeName: string,
  info: TInfo,
  ...testActions: Array<[keyof TActions, Record<string, any>]>
) {
  describe(typeName, () => {
    let app: Application;
    let ignoreLogErrors: RegExp[] = [];

    beforeEach(async () => {
      ignoreLogErrors = [];

      const DB = require("./db").DB as unknown as InMemoryDB;
      DB._reset();
      await DB.collection("_default").insert("User/test", {
        username: "test",
        passwordHash: await hash("password"),
        permissions: ["SUDO"],
      });
      await DB.collection("_default").insert("BootstrapState", {
        bootstrapped: true,
      });

      app = Express();
      app.use(jsonParser());
      app.use(cookieParser());
      const baseRouter = Router();
      baseRouter.use("/events", createEventTypesRouter());
      app.use("/api", baseRouter);
      app.use(((err: any, req: Request, res: Response, next: NextFunction) => {
        if (err) {
          for (const exp of ignoreLogErrors) {
            if (exp.test(String(err))) {
              return next(err);
            }
          }
          console.warn(err);
          next(err);
        }
      }) as any);
      app.use(errorHandler(getLogger("test")));
    });

    describe("list", () => {
      test("zero", async () => {
        const DB = require("./db").DB as unknown as InMemoryDB;
        DB.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
          .get(`/api/events/${typeName}`)
          .auth("test", "password");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(0);
      });

      test("one", async () => {
        const DB = require("./db").DB as unknown as InMemoryDB;
        DB.query.mockResolvedValueOnce({
          rows: [[wrapAction(Init({}))]],
        });

        const response = await request(app)
          .get(`/api/events/${typeName}`)
          .auth("test", "password");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(1);
      });
    });

    describe("create", () => {
      it("creates an event", async () => {
        const createRes = await request(app)
          .post(`/api/events/${typeName}`)
          .send({
            name: "Test",
            worthPoints: 4,
          })
          .auth("test", "password");
        expect(createRes.statusCode).toBe(201);
        expect(createRes.body.id).toHaveLength(
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa".length
        );
      });

      it("returns it on a subsequent get", async () => {
        const DB = require("./db").DB as unknown as InMemoryDB;
        const createRes = await request(app)
          .post(`/api/events/${typeName}`)
          .send({
            name: "Test",
            worthPoints: 4,
          })
          .auth("test", "password");
        expect(createRes.statusCode).toBe(201);
        expect(createRes.body.id).toHaveLength(
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa".length
        );

        const getRes = await request(app)
          .get(`/api/events/${typeName}/${createRes.body.id}`)
          .auth("test", "password");
        expect(getRes.statusCode).toBe(200);
        expect(getRes.body.id).toEqual(createRes.body.id);
      });

      it("errors if any fields are missing", async () => {
        ignoreLogErrors = [/ValidationError/];
        const createRes = await request(app)
          .post(`/api/events/${typeName}`)
          .send({
            name: "Test",
          })
          .auth("test", "password");
        expect(createRes.statusCode).toBe(422);
      });
    });

    describe("update", () => {
      it("works", async () => {
        const DB = require("./db").DB as unknown as InMemoryDB;
        const id = `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`;
        const initialVal = info.schema.cast({
          id: id,
          type: typeName,
          name: "test",
          worthPoints: 4,
          notCovered: false,
          startTime: "2022-05-28T00:00:00.000Z",
        });
        await DB.collection("_default").insert(`Event/${typeName}/${id}`, [
          wrapAction(Init(initialVal)),
        ]);

        const newVal = info.schema.cast({
          id: id,
          type: typeName,
          name: "test",
          worthPoints: 2,
          notCovered: false,
          startTime: "2022-05-28T00:00:00.000Z",
        });

        const updateRes = await request(app)
          .put(`/api/events/${typeName}/${id}`)
          .send(newVal)
          .auth("test", "password");
        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body.worthPoints).toBe(2);

        const persistedVal = await DB.collection("_default").get(
          `Event/${typeName}/${id}`
        );
        expect(persistedVal.content).toHaveLength(2);
        expect(persistedVal.content[1].payload.worthPoints).toBe(2);
      });
    });

    describe("declareWinner", () => {
      it("works", async () => {
        const DB = require("./db").DB as unknown as InMemoryDB;
        const id = `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`;
        const initialVal = info.schema.cast({
          id: id,
          type: typeName,
          name: "test",
          worthPoints: 4,
          notCovered: false,
          startTime: "2022-05-28T00:00:00.000Z",
        });
        await DB.collection("_default").insert(`Event/${typeName}/${id}`, [
          wrapAction(Init(initialVal)),
        ]);

        const res = await request(app)
          .post(`/api/events/${typeName}/${id}/_declareWinner`)
          .send({ winner: "away" })
          .auth("test", "password");
        expect(res.statusCode).toBe(200);
        expect(res.body.winner).toBe("away");

        const persistedVal = await DB.collection("_default").get(
          `Event/${typeName}/${id}`
        );
        expect(persistedVal.content).toHaveLength(2);
        expect(persistedVal.content[1].payload.winner).toBe("away");
        expect(
          require("./updateTournamentSummary.job").doUpdate
        ).toHaveBeenCalled();
      });
      it("correctly handles multiple updates", async () => {
        const DB = require("./db").DB as unknown as InMemoryDB;
        const id = `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`;
        const initialVal = info.schema.cast({
          id: id,
          type: typeName,
          name: "test",
          worthPoints: 4,
          notCovered: false,
          startTime: "2022-05-28T00:00:00.000Z",
        });
        await DB.collection("_default").insert(`Event/${typeName}/${id}`, [
          wrapAction(Init(initialVal)),
        ]);

        const res1 = await request(app)
          .post(`/api/events/${typeName}/${id}/_declareWinner`)
          .send({ winner: "away" })
          .auth("test", "password");
        expect(res1.statusCode).toBe(200);
        expect(res1.body.winner).toBe("away");

        const res2 = await request(app)
          .post(`/api/events/${typeName}/${id}/_declareWinner`)
          .send({ winner: "home" })
          .auth("test", "password");
        expect(res2.statusCode).toBe(200);
        expect(res2.body.winner).toBe("home");

        const persistedVal = await DB.collection("_default").get(
          `Event/${typeName}/${id}`
        );
        expect(persistedVal.content).toHaveLength(3);
        expect(persistedVal.content[2].payload.winner).toBe("home");
      });
    });

    describe("actions", () => {
      it("does not crash", async () => {
        const DB = require("./db").DB as unknown as InMemoryDB;
        const id = `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`;
        const initialVal = info.schema.cast({
          id: id,
          type: typeName,
          name: "test",
          worthPoints: 4,
          notCovered: false,
          startTime: "2022-05-28T00:00:00.000Z",
        });
        await DB.collection("_default").insert(`Event/${typeName}/${id}`, [
          wrapAction(Init(initialVal)),
        ]);

        for (const [type, payload] of testActions) {
          const res = await request(app)
            .post(`/api/events/${typeName}/${id}/${type}`)
            .send(payload)
            .auth("test", "password");
          expect(res.statusCode).toBe(200);
        }

        const persistedVal = await DB.collection("_default").get(
          `Event/${typeName}/${id}`
        );
        expect(persistedVal.content).toHaveLength(testActions.length + 1);
      });
    });

    describe("undo/redo", () => {
      it("undoes", async () => {
        const DB = require("./db").DB as unknown as InMemoryDB;
        const id = `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`;
        const initialVal = info.schema.cast({
          id: id,
          type: typeName,
          name: "test",
          worthPoints: 4,
          notCovered: false,
          startTime: "2022-05-28T00:00:00.000Z",
        });
        await DB.collection("_default").insert(`Event/${typeName}/${id}`, [
          wrapAction(Init(initialVal)),
        ]);

        for (const [type, payload] of testActions) {
          const res = await request(app)
            .post(`/api/events/${typeName}/${id}/${type}`)
            .send(payload)
            .auth("test", "password");
          expect(res.statusCode).toBe(200);
        }

        let persistedVal = await DB.collection("_default").get(
          `Event/${typeName}/${id}`
        );
        expect(persistedVal.content).toHaveLength(testActions.length + 1);
        const ts =
          persistedVal.content[persistedVal.content.length - 1].meta.ts;

        const res = await request(app)
          .post(`/api/events/${typeName}/${id}/_undo`)
          .send({ ts })
          .auth("test", "password");
        expect(res.statusCode).toBe(200);
        persistedVal = await DB.collection("_default").get(
          `Event/${typeName}/${id}`
        );
        expect(persistedVal.content).toHaveLength(testActions.length + 2);
        expect(persistedVal.content[persistedVal.content.length - 1].type).toBe(
          Undo.type
        );
      });

      it("redos (special case)", async () => {
        const DB = require("./db").DB as unknown as InMemoryDB;
        const id = `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`;
        const initialVal = info.schema.cast({
          id: id,
          type: typeName,
          name: "test",
          worthPoints: 4,
          notCovered: false,
          startTime: "2022-05-28T00:00:00.000Z",
        });
        await DB.collection("_default").insert(`Event/${typeName}/${id}`, [
          wrapAction(Init(initialVal)),
        ]);

        for (const [type, payload] of testActions) {
          const res = await request(app)
            .post(`/api/events/${typeName}/${id}/${type}`)
            .send(payload)
            .auth("test", "password");
          expect(res.statusCode).toBe(200);
        }

        let persistedVal = await DB.collection("_default").get(
          `Event/${typeName}/${id}`
        );
        expect(persistedVal.content).toHaveLength(testActions.length + 1);
        const ts =
          persistedVal.content[persistedVal.content.length - 1].meta.ts;

        const undoRes = await request(app)
          .post(`/api/events/${typeName}/${id}/_undo`)
          .send({ ts })
          .auth("test", "password");
        expect(undoRes.statusCode).toBe(200);
        const redoRes = await request(app)
          .post(`/api/events/${typeName}/${id}/_redo`)
          .send({ ts })
          .auth("test", "password");
        expect(redoRes.statusCode).toBe(200);

        persistedVal = await DB.collection("_default").get(
          `Event/${typeName}/${id}`
        );
        expect(persistedVal.content).toHaveLength(testActions.length + 1);
      });

      (testActions.length < 3 ? it.skip : it)(
        "redos (NO special case)",
        async () => {
          const DB = require("./db").DB as unknown as InMemoryDB;
          const id = `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`;
          const initialVal = info.schema.cast({
            id: id,
            type: typeName,
            name: "test",
            worthPoints: 4,
            notCovered: false,
            startTime: "2022-05-28T00:00:00.000Z",
          });
          await DB.collection("_default").insert(`Event/${typeName}/${id}`, [
            wrapAction(Init(initialVal)),
          ]);

          // Apply all but the last action, then undo it, then apply the last

          for (const [type, payload] of testActions.slice(0, -1)) {
            const res = await request(app)
              .post(`/api/events/${typeName}/${id}/${type}`)
              .send(payload)
              .auth("test", "password");
            expect(res.statusCode).toBe(200);
          }

          let persistedVal = await DB.collection("_default").get(
            `Event/${typeName}/${id}`
          );
          expect(persistedVal.content).toHaveLength(testActions.length - 1 + 1);
          const ts =
            persistedVal.content[persistedVal.content.length - 1].meta.ts;

          const undoRes = await request(app)
            .post(`/api/events/${typeName}/${id}/_undo`)
            .send({ ts })
            .auth("test", "password");
          expect(undoRes.statusCode).toBe(200);

          const lastAction = testActions[testActions.length - 1];
          const lastRes = await request(app)
            .post(`/api/events/${typeName}/${id}/${lastAction[0]}`)
            .send(lastAction[1])
            .auth("test", "password");
          expect(lastRes.statusCode).toBe(200);

          const redoRes = await request(app)
            .post(`/api/events/${typeName}/${id}/_redo`)
            .send({ ts })
            .auth("test", "password");
          expect(redoRes.statusCode).toBe(200);

          persistedVal = await DB.collection("_default").get(
            `Event/${typeName}/${id}`
          );
          expect(persistedVal.content).toHaveLength(testActions.length + 3);
        }
      );
    });
  });
}

runTests(
  "football",
  EVENT_TYPES.football,
  ["startHalf", {}],
  ["goal", { side: "home", player: null }],
  ["goal", { side: "home", player: null }]
);
