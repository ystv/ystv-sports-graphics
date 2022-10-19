/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import { hash } from "argon2";
import cookieParser from "cookie-parser";
import request from "supertest";
import { json as jsonParser } from "body-parser";
import Express, { Application, NextFunction, Router } from "express";
import {
  BaseEventStateType,
  EventMeta,
  EventTypeInfo,
  League,
  TeamInfo,
} from "../common/types";
import { errorHandler } from "./httpUtils";
import { getLogger } from "./loggingSetup";
import { InMemoryDB } from "./__mocks__/db";
import { createEventTypesRouter } from "./eventTypeRoutes";
import { EVENT_TYPES } from "../common/sports";
import { wrapAction, Init, Undo } from "../common/eventStateHelpers";
import { cloneDeep } from "lodash-es";

jest.mock("./db");
jest.mock("./redis");
jest.mock("./updateTournamentSummary.job");

function runTests<
  TActions extends { [K: string]: (payload?: any) => { type: string } },
  TInfo extends EventTypeInfo<BaseEventStateType, TActions>
>(
  typeName: string,
  info: TInfo,
  ...testActions: Array<[keyof TActions, Record<string, any>]>
) {
  async function initEventDB() {
    const DB = require("./db").DB as unknown as InMemoryDB;
    const id = `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`;
    const testTeam: TeamInfo = {
      name: "Test",
      abbreviation: "TEST",
      primaryColour: "#000000",
      secondaryColour: "#000000",
      crestAttachmentID: "",
      slug: "test",
    };
    const initialMeta: Omit<EventMeta, "id" | "type"> = {
      name: "test",
      notCovered: false,
      startTime: "2022-05-28T00:00:00Z",
      worthPoints: 4,
      homeTeam: testTeam,
      awayTeam: testTeam,
    };
    const initialState = info.stateSchema.cast({});
    await DB.collection("_default").insert(
      `EventMeta/test-league/${typeName}/${id}`,
      initialMeta
    );
    await DB.collection("_default").insert(
      `EventHistory/test-league/${typeName}/${id}`,
      [wrapAction(Init(initialState))]
    );
    await DB.collection("_default").insert("Team/test", testTeam);
    return { DB, id };
  }

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
      const testLeague: League = {
        name: "Test League",
        slug: "test-league",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };
      await DB.collection("_default").insert("League/test-league", testLeague);

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
          .get(`/api/events/test-league/${typeName}`)
          .auth("test", "password");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(0);
      });

      test("one", async () => {
        const id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const testMeta: EventMeta = {
          id: `EventMeta/test-league/football/${id}`,
          league: "test-league",
          type: "football",
          name: "Test Event",
          worthPoints: 4,
          startTime: "2022-05-28T00:00:00Z",
          homeTeam: {
            name: "Test",
            abbreviation: "TEST",
            primaryColour: "#000000",
            secondaryColour: "#000000",
            crestAttachmentID: "",
            slug: "test",
          },
          awayTeam: {
            name: "Test",
            abbreviation: "TEST",
            primaryColour: "#000000",
            secondaryColour: "#000000",
            crestAttachmentID: "",
            slug: "test",
          },
        };
        const DB = require("./db").DB as unknown as InMemoryDB;
        await DB.collection("_default").insert(
          `EventMeta/test-league/football/${id}`,
          testMeta
        );
        await DB.collection("_default").insert(
          `EventHistory/test-league/football/${id}`,
          []
        );
        DB.query.mockResolvedValueOnce({
          rows: [testMeta],
        });

        const response = await request(app)
          .get(`/api/events/test-league/${typeName}`)
          .auth("test", "password");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(1);
      });
    });

    describe("create", () => {
      it("creates an event", async () => {
        const DB = require("./db").DB as unknown as InMemoryDB;
        await DB.collection("_default").insert("Team/test", {});
        const createRes = await request(app)
          .post(`/api/events/test-league/${typeName}`)
          .send({
            name: "Test",
            worthPoints: 4,
            homeTeam: "test",
            awayTeam: "test",
          })
          .auth("test", "password");
        expect(createRes.statusCode).toBe(201);
        expect(createRes.body.id).toHaveLength(
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa".length
        );
      });

      it("returns it on a subsequent get", async () => {
        const DB = require("./db").DB as unknown as InMemoryDB;
        await DB.collection("_default").insert("Team/test", {});
        const createRes = await request(app)
          .post(`/api/events/test-league/${typeName}`)
          .send({
            name: "Test",
            worthPoints: 4,
            homeTeam: "test",
            awayTeam: "test",
          })
          .auth("test", "password");
        expect(createRes.statusCode).toBe(201);
        expect(createRes.body.id).toHaveLength(
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa".length
        );

        const getRes = await request(app)
          .get(`/api/events/test-league/${typeName}/${createRes.body.id}`)
          .auth("test", "password");
        expect(getRes.statusCode).toBe(200);
        expect(getRes.body.id).toEqual(createRes.body.id);
      });

      it("errors if any fields are missing", async () => {
        ignoreLogErrors = [/ValidationError/];
        const createRes = await request(app)
          .post(`/api/events/test-league/${typeName}`)
          .send({
            name: "Test",
          })
          .auth("test", "password");
        expect(createRes.statusCode).toBe(422);
      });
    });

    describe("update event", () => {
      it("works", async () => {
        const { DB, id } = await initEventDB();

        const newMeta: Omit<EventMeta, "id" | "type"> = {
          name: "test",
          notCovered: false,
          startTime: "2022-05-28T00:00:00Z",
          worthPoints: 2,
          homeTeam: "test",
          awayTeam: "test",
        };

        const updateRes = await request(app)
          .put(`/api/events/test-league/${typeName}/${id}`)
          .send(newMeta)
          .auth("test", "password");
        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body.worthPoints).toBe(2);

        const persistedVal = await DB.collection("_default").get(
          `EventMeta/test-league/${typeName}/${id}`
        );
        expect(persistedVal.content.worthPoints).toBe(2);
      });
    });

    describe("declareWinner", () => {
      it("works", async () => {
        const { DB, id } = await initEventDB();

        const res = await request(app)
          .post(`/api/events/test-league/${typeName}/${id}/_declareWinner`)
          .send({ winner: "away" })
          .auth("test", "password");
        expect(res.statusCode).toBe(200);
        expect(res.body.winner).toBe("away");

        const persistedVal = await DB.collection("_default").get(
          `EventMeta/test-league/${typeName}/${id}`
        );
        expect(persistedVal.content.winner).toBe("away");
        expect(
          require("./updateTournamentSummary.job").doUpdate
        ).toHaveBeenCalled();
      });
      it("correctly handles multiple updates", async () => {
        const { DB, id } = await initEventDB();

        const res1 = await request(app)
          .post(`/api/events/test-league/${typeName}/${id}/_declareWinner`)
          .send({ winner: "away" })
          .auth("test", "password");
        expect(res1.statusCode).toBe(200);
        expect(res1.body.winner).toBe("away");

        const res2 = await request(app)
          .post(`/api/events/test-league/${typeName}/${id}/_declareWinner`)
          .send({ winner: "home" })
          .auth("test", "password");
        expect(res2.statusCode).toBe(200);
        expect(res2.body.winner).toBe("home");

        const persistedVal = await DB.collection("_default").get(
          `EventMeta/test-league/${typeName}/${id}`
        );
        expect(persistedVal.content.winner).toBe("home");
      });
    });

    describe("actions", () => {
      it("does not crash", async () => {
        const { DB, id } = await initEventDB();

        for (const [type, payload] of testActions) {
          const res = await request(app)
            .post(`/api/events/test-league/${typeName}/${id}/${type}`)
            .send(payload)
            .auth("test", "password");
          expect(res.statusCode).toBe(200);
        }

        const persistedHistory = await DB.collection("_default").get(
          `EventHistory/test-league/${typeName}/${id}`
        );
        expect(persistedHistory.content).toHaveLength(testActions.length + 1);
      });
    });

    describe("undo/redo", () => {
      it("undoes", async () => {
        const { DB, id } = await initEventDB();

        for (const [type, payload] of testActions) {
          const res = await request(app)
            .post(`/api/events/test-league/${typeName}/${id}/${type}`)
            .send(payload)
            .auth("test", "password");
          expect(res.statusCode).toBe(200);
        }

        let persistedHistory = await DB.collection("_default").get(
          `EventHistory/test-league/${typeName}/${id}`
        );
        expect(persistedHistory.content).toHaveLength(testActions.length + 1);
        const ts =
          persistedHistory.content[persistedHistory.content.length - 1].meta.ts;

        const res = await request(app)
          .post(`/api/events/test-league/${typeName}/${id}/_undo`)
          .send({ ts })
          .auth("test", "password");
        expect(res.statusCode).toBe(200);
        persistedHistory = await DB.collection("_default").get(
          `EventHistory/test-league/${typeName}/${id}`
        );
        expect(persistedHistory.content).toHaveLength(testActions.length + 2);
        expect(
          persistedHistory.content[persistedHistory.content.length - 1].type
        ).toBe(Undo.type);
      });

      it("redos (special case)", async () => {
        const { DB, id } = await initEventDB();

        for (const [type, payload] of testActions) {
          const res = await request(app)
            .post(`/api/events/test-league/${typeName}/${id}/${type}`)
            .send(payload)
            .auth("test", "password");
          expect(res.statusCode).toBe(200);
        }

        let persistedHistory = await DB.collection("_default").get(
          `EventHistory/test-league/${typeName}/${id}`
        );
        expect(persistedHistory.content).toHaveLength(testActions.length + 1);
        const ts =
          persistedHistory.content[persistedHistory.content.length - 1].meta.ts;

        const undoRes = await request(app)
          .post(`/api/events/test-league/${typeName}/${id}/_undo`)
          .send({ ts })
          .auth("test", "password");
        expect(undoRes.statusCode).toBe(200);
        const redoRes = await request(app)
          .post(`/api/events/test-league/${typeName}/${id}/_redo`)
          .send({ ts })
          .auth("test", "password");
        expect(redoRes.statusCode).toBe(200);

        persistedHistory = await DB.collection("_default").get(
          `EventHistory/test-league/${typeName}/${id}`
        );
        expect(persistedHistory.content).toHaveLength(testActions.length + 1);
      });

      (testActions.length < 3 ? it.skip : it)(
        "redos (NO special case)",
        async () => {
          const { DB, id } = await initEventDB();

          // Apply all but the last action, then undo it, then apply the last

          for (const [type, payload] of testActions.slice(0, -1)) {
            const res = await request(app)
              .post(`/api/events/test-league/${typeName}/${id}/${type}`)
              .send(payload)
              .auth("test", "password");
            expect(res.statusCode).toBe(200);
          }

          let persistedHistory = await DB.collection("_default").get(
            `EventHistory/test-league/${typeName}/${id}`
          );
          expect(persistedHistory.content).toHaveLength(
            testActions.length - 1 + 1
          );
          const ts =
            persistedHistory.content[persistedHistory.content.length - 1].meta
              .ts;

          const undoRes = await request(app)
            .post(`/api/events/test-league/${typeName}/${id}/_undo`)
            .send({ ts })
            .auth("test", "password");
          expect(undoRes.statusCode).toBe(200);

          const lastAction = testActions[testActions.length - 1];
          const lastRes = await request(app)
            .post(`/api/events/test-league/${typeName}/${id}/${lastAction[0]}`)
            .send(lastAction[1])
            .auth("test", "password");
          expect(lastRes.statusCode).toBe(200);

          const redoRes = await request(app)
            .post(`/api/events/test-league/${typeName}/${id}/_redo`)
            .send({ ts })
            .auth("test", "password");
          expect(redoRes.statusCode).toBe(200);

          persistedHistory = await DB.collection("_default").get(
            `EventHistory/test-league/${typeName}/${id}`
          );
          expect(persistedHistory.content).toHaveLength(testActions.length + 3);
        }
      );
    });

    describe("update action", () => {
      it("update an earlier action", async () => {
        const { DB, id } = await initEventDB();

        for (const [type, payload] of testActions) {
          const res = await request(app)
            .post(`/api/events/test-league/${typeName}/${id}/${type}`)
            .send(payload)
            .auth("test", "password");
          expect(res.statusCode).toBe(200);
        }

        const persistedHistory = await DB.collection("_default").get(
          `EventHistory/test-league/${typeName}/${id}`
        );
        expect(persistedHistory.content).toHaveLength(testActions.length + 1);
        const ts =
          persistedHistory.content[persistedHistory.content.length - 1].meta.ts;
        const newAction = cloneDeep(
          persistedHistory.content[testActions.length - 1]
        ).payload;

        if (!("side" in newAction)) {
          console.warn("SKIP - no side in testAction");
          return;
        }
        let newSide;
        if (newAction.side === "home") {
          newAction.side = newSide = "away";
        } else {
          newAction.side = newSide = "home";
        }

        const res = await request(app)
          .post(`/api/events/test-league/${typeName}/${id}/_update`)
          .send({
            ts,
            ...newAction,
          })
          .auth("test", "password");
        expect(res.statusCode).toBe(200);

        const historyRes = await request(app)
          .get(`/api/events/test-league/${typeName}/${id}/_history`)
          .auth("test", "password");
        expect(historyRes.statusCode).toBe(200);
        expect(historyRes.body).toHaveLength(testActions.length + 1);
        expect(historyRes.body[testActions.length].payload.side).toBe(newSide);
      });

      it("change the ts of an earlier action", async () => {
        const { DB, id } = await initEventDB();

        for (const [type, payload] of testActions) {
          const res = await request(app)
            .post(`/api/events/test-league/${typeName}/${id}/${type}`)
            .auth("test", "password")
            .send(payload);
          expect(res.statusCode).toBe(200);
        }

        const persistedHistory = await DB.collection("_default").get(
          `EventHistory/test-league/${typeName}/${id}`
        );
        expect(persistedHistory.content).toHaveLength(testActions.length + 1);
        const ts =
          persistedHistory.content[persistedHistory.content.length - 1].meta.ts;
        const newAction = cloneDeep(
          persistedHistory.content[testActions.length - 1]
        ).payload;
        const newTs = ts + 50;

        const res = await request(app)
          .post(`/api/events/test-league/${typeName}/${id}/_update`)
          .send({
            ts,
            newTs,
            ...newAction,
          })
          .auth("test", "password");
        expect(res.statusCode).toBe(200);

        const historyRes = await request(app)
          .get(`/api/events/test-league/${typeName}/${id}/_history`)
          .auth("test", "password");
        expect(historyRes.statusCode).toBe(200);
        expect(historyRes.body).toHaveLength(testActions.length + 1);
        expect(historyRes.body[testActions.length].meta.ts).toBe(newTs);
      });
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
