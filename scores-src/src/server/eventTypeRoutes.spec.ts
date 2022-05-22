/* eslint-disable @typescript-eslint/no-var-requires */
import { hash } from "argon2";
import cookieParser from "cookie-parser";
import request from "supertest";
import { json as jsonParser } from "body-parser";
import Express, { Application, NextFunction, Router } from "express";
import { EventTypeInfo } from "../common/types";
import { createEventsRouter } from "./eventsRoutes";
import { errorHandler } from "./httpUtils";
import { getLogger } from "./loggingSetup";
import { InMemoryDB } from "./__mocks__/db";
import { createEventTypesRouter } from "./eventTypeRoutes";
import { EVENT_TYPES } from "../common/sports";
import { wrapAction, Init } from "../common/eventStateHelpers";

jest.mock("./db");
jest.mock("./redis");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runTests(typeName: string, info: EventTypeInfo<unknown, any>) {
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
        console.log(getRes.body);
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
  });
}

runTests("football", EVENT_TYPES.football);
