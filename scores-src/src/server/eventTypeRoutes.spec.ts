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
import { wrapAction, Init } from "../common/eventStateHelpers";

jest.mock("./db");
jest.mock("./redis");
jest.mock("./updateTournamentSummary.job");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runTests(typeName: string, info: EventTypeInfo<BaseEventType, any>) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  });
}

runTests("football", EVENT_TYPES.football);
