/* eslint-disable @typescript-eslint/no-var-requires */
import Express, { Application, NextFunction, Router } from "express";
import { json as jsonParser } from "body-parser";
import cookieParser from "cookie-parser";
import request from "supertest";

import { createEventsRouter } from "./eventsRoutes";
import { hash } from "argon2";
import { InMemoryDB } from "./__mocks__/db";
import { getLogger } from "./loggingSetup";
import { Init, wrapAction } from "../common/eventStateHelpers";
import { errorHandler } from "./httpUtils";

jest.mock("./db");

describe("eventsRoutes", () => {
  let app: Application;

  beforeEach(async () => {
    const DB = require("./db").DB as unknown as InMemoryDB;
    DB._reset();
    await DB.collection("_default").upsert("User/test", {
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
    baseRouter.use("/events", createEventsRouter());
    app.use("/api", baseRouter);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use(((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err) {
        console.warn(err);
        next(err);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use(errorHandler(getLogger("test")));
  });

  describe("list events", () => {
    test("smoke", async () => {
      const DB = require("./db").DB as unknown as InMemoryDB;
      DB.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get("/api/events")
        .auth("test", "password");
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    test("one", async () => {
      const DB = require("./db").DB as unknown as InMemoryDB;
      DB.query.mockResolvedValueOnce({
        rows: [
          {
            id: "Event/football/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            data: [wrapAction(Init({}))],
          },
        ],
      });

      const response = await request(app)
        .get("/api/events")
        .auth("test", "password");
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].type).toBe("football");
    });

    test("onlyCovered", async () => {
      const DB = require("./db").DB as unknown as InMemoryDB;
      DB.query.mockResolvedValueOnce({
        rows: [
          {
            id: "Event/football/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            data: [wrapAction(Init({ notCovered: true }))],
          },
          {
            id: "Event/netball/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            data: [wrapAction(Init({}))],
          },
        ],
      });

      const response = await request(app)
        .get("/api/events?onlyCovered=true")
        .auth("test", "password");
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].type).toBe("netball");
    });
  });
});
