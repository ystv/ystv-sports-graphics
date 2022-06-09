/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */

import { hash } from "argon2";
import Express, { NextFunction, Router, Application } from "express";
import ExpressWS from "express-ws";
import { json as jsonParser } from "body-parser";
import cookieParser from "cookie-parser";
import { InMemoryDB } from "./__mocks__/db";
import { createEventTypesRouter } from "./eventTypeRoutes";
import { RedisFlushModes } from "@node-redis/client/dist/lib/commands/FLUSHALL";
import { errorHandler } from "./httpUtils";
import { getLogger } from "./loggingSetup";
import { createLiveRouter } from "./liveRoutes";
import { close as closeRedis, connect as connectToRedis, REDIS } from "./redis";
import { Server } from "http";
import { once } from "events";
import invariant from "tiny-invariant";
import { createSessionForUser } from "./auth";
import { WebSocket } from "ws";
import request from "superagent";
import { TeamInfo } from "../common/types";
import { createTeamsRouter } from "./teamsRoutes";

jest.unmock("redis").unmock("./redis");
jest.mock("./db");

beforeAll(async () => {
  try {
    await connectToRedis();
    await REDIS.ping();
  } catch (e) {
    console.error(
      "Failed to connect to Redis. Skipping tests that require a Redis",
      e
    );
    process.exit(1);
  }
});

class TestSocket {
  ws: WebSocket;
  messageQueue: Array<Record<string, unknown>> = [];

  static openSockets = new Set<WebSocket>();

  constructor(url: string) {
    this.ws = new WebSocket(url);
    TestSocket.openSockets.add(this.ws);
    this.ws.on("close", () => {
      TestSocket.openSockets.delete(this.ws);
    });
    this.ws.on("error", (err) => {
      console.error("TS error!", err);
    });
    this.ws.on("message", (rawData) => {
      let payload: string;
      if (typeof rawData === "string") {
        payload = rawData;
      } else if (rawData instanceof Buffer) {
        payload = rawData.toString("utf-8");
      } else {
        throw new Error("Unknown payload type: " + rawData);
      }
      const data = JSON.parse(payload);
      // console.debug("TS message", data);
      this.messageQueue.push(data);
    });
  }
  async waitForOpen(): Promise<void> {
    if (this.ws.readyState === this.ws.OPEN) {
      return Promise.resolve();
    } else {
      await once(this.ws, "open");
    }
  }
  waitForMessage(
    maxAttempts = 100,
    ignorePings = false
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let attempt = 0;
      const closeCheck = (code: number) => {
        reject(`WS closed while waiting for message: code ${code}`);
      };
      this.ws.once("close", closeCheck);
      const msgCheck = () => {
        if (this.messageQueue.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const msg = this.messageQueue.shift()!;
          if (!ignorePings || msg.kind !== "PING") {
            this.ws.removeListener("close", closeCheck);
            resolve(msg);
            return;
          }
        }
        if (++attempt > maxAttempts) {
          reject(new Error("Max attempts exceeded"));
          return;
        }
        setTimeout(msgCheck, 50);
      };
      msgCheck();
    });
  }
  async close(expectOpen = true): Promise<void> {
    if (this.ws.readyState === this.ws.CLOSED) {
      invariant(!expectOpen, "WS was already closed when close() was called");
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.ws.on("close", () => resolve());
      this.ws.close();
    });
  }
  waitForClose(expectOpen = true): Promise<number> {
    if (expectOpen) {
      invariant(this.ws.readyState !== this.ws.CLOSED, "already closed");
    }
    return new Promise((resolve) => {
      this.ws.on("close", (code) => resolve(code));
      this.ws.close();
    });
  }
  send(data: Record<string, unknown>): Promise<void> {
    invariant(this.ws, "no ws!");
    invariant(this.ws.readyState === this.ws.OPEN, "WS not open");
    return new Promise((resolve, reject) => {
      this.ws.send(JSON.stringify(data), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

describe("Updates Stream", () => {
  let app: Application;
  let server: Server;
  let testPort: number;

  beforeAll(async () => {
    await REDIS.select(1);

    app = Express();
    const ws = ExpressWS(app);
    app.use(jsonParser());
    app.use(cookieParser());
    const baseRouter = Router();
    baseRouter.use("/events", createEventTypesRouter());
    baseRouter.use("/teams", createTeamsRouter());
    app.use("/api", baseRouter);
    app.use("/api", createLiveRouter());
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

    server = app.listen(0);
    await once(server, "listening");
    const addr = server.address();
    invariant(
      typeof addr !== "string" && addr !== null,
      "expected non-string address"
    );
    testPort = addr.port;
  });

  afterAll((cb) => {
    if (server) {
      server.close(async () => {
        await closeRedis();
        cb();
      });
    } else {
      closeRedis().then(cb);
    }
  });

  let ignoreLogErrors: RegExp[] = [];
  let testToken: string;

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
    const testTeam: TeamInfo = {
      name: "Test",
      abbreviation: "TEST",
      slug: "test",
      primaryColour: "#000000",
      secondaryColour: "#fafafa",
      crestAttachmentID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    };
    await DB.collection("_default").insert("Team/test", testTeam);
    testToken = await createSessionForUser("test");

    await REDIS.flushDb(RedisFlushModes.SYNC);
  });

  afterEach(async () => {
    if (TestSocket.openSockets.size > 0) {
      console.warn(`${TestSocket.openSockets.size} unclosed TestSockets found`);
      for (const sock of TestSocket.openSockets.values()) {
        await new Promise<void>((resolve) => {
          sock.on("close", resolve);
          sock.close();
        });
      }
    }
  });

  test("connects", async () => {
    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?token=${testToken}`
    );
    await ts.waitForOpen();
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "HELLO");
    await ts.close();
  });

  test("connects with a bad token", async () => {
    expect.assertions(1);
    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?token=nonsense`
    );
    await ts.waitForOpen();
    await expect(ts.waitForClose()).resolves.toBe(1008);
  });

  test("fails to subscribe to a nonsense feed", async () => {
    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?token=${testToken}`
    );
    await ts.waitForOpen();
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "HELLO");
    await ts.send({ kind: "SUBSCRIBE", to: "garbage" });
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "ERROR");
    await ts.close();
  });

  test("subscribes to a valid(ish) feed", async () => {
    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?token=${testToken}`
    );
    await ts.waitForOpen();
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "HELLO");
    await ts.send({ kind: "SUBSCRIBE", to: "Event/football/bar" });
    await expect(ts.waitForMessage()).resolves.toHaveProperty(
      "kind",
      "SUBSCRIBE_OK"
    );
    await ts.close();
  });

  test("receives event updates (state mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/football`)
      .auth("test", "password")
      .send({
        name: "test",
        worthPoints: 0,
        startTime: "2022-05-29T00:00:00Z",
        homeTeam: "test",
        awayTeam: "test",
      });
    const testEvent = testEventRes.body;

    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?token=${testToken}`
    );
    await ts.waitForOpen();
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "HELLO");
    await ts.send({ kind: "SUBSCRIBE", to: `Event/football/${testEvent.id}` });
    await expect(ts.waitForMessage()).resolves.toHaveProperty(
      "kind",
      "SUBSCRIBE_OK"
    );

    const actionRes = await request
      .post(
        `http://localhost:${testPort}/api/events/football/${testEvent.id}/startHalf`
      )
      .auth("test", "password")
      .send({});
    expect(actionRes.statusCode).toBe(200);

    const message = await ts.waitForMessage();
    expect(message).toMatchInlineSnapshot(
      {
        kind: "CHANGE",
        changed: expect.any(String),
        mid: expect.any(String),
        data: {
          clock: {
            wallClockLastStarted: expect.any(Number),
          },

          id: expect.any(String),
        },
      },
      `
      Object {
        "changed": Any<String>,
        "data": Object {
          "awayTeam": Object {
            "abbreviation": "TEST",
            "crestAttachmentID": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "name": "Test",
            "primaryColour": "#000000",
            "secondaryColour": "#fafafa",
            "slug": "test",
          },
          "clock": Object {
            "state": "running",
            "timeLastStartedOrStopped": 0,
            "type": "upward",
            "wallClockLastStarted": Any<Number>,
          },
          "halves": Array [
            Object {
              "goals": Array [],
              "stoppageTime": 0,
            },
          ],
          "homeTeam": Object {
            "abbreviation": "TEST",
            "crestAttachmentID": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "name": "Test",
            "primaryColour": "#000000",
            "secondaryColour": "#fafafa",
            "slug": "test",
          },
          "id": Any<String>,
          "name": "test",
          "notCovered": false,
          "players": Object {
            "away": Array [],
            "home": Array [],
          },
          "scoreAway": 0,
          "scoreHome": 0,
          "startTime": "2022-05-29T00:00:00Z",
          "type": "football",
          "worthPoints": 0,
        },
        "kind": "CHANGE",
        "mid": Any<String>,
      }
    `
    );

    await ts.close();
  });

  test("receives event updates (actions mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/football`)
      .auth("test", "password")
      .send({
        name: "test",
        worthPoints: 0,
        startTime: "2022-05-29T00:00:00Z",
        homeTeam: "test",
        awayTeam: "test",
      });
    const testEvent = testEventRes.body;

    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?mode=actions&token=${testToken}`
    );
    await ts.waitForOpen();
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "HELLO");
    await ts.send({ kind: "SUBSCRIBE", to: `Event/football/${testEvent.id}` });
    await expect(ts.waitForMessage()).resolves.toHaveProperty(
      "kind",
      "SUBSCRIBE_OK"
    );

    const actionRes = await request
      .post(
        `http://localhost:${testPort}/api/events/football/${testEvent.id}/startHalf`
      )
      .auth("test", "password")
      .send({});
    expect(actionRes.statusCode).toBe(200);

    const message = await ts.waitForMessage();
    expect(message).toMatchInlineSnapshot(
      {
        kind: "ACTION",
        event: expect.any(String),
        mid: expect.any(String),
        meta: {
          ts: expect.any(Number),
        },
      },
      `
      Object {
        "event": Any<String>,
        "kind": "ACTION",
        "meta": Object {
          "ts": Any<Number>,
        },
        "mid": Any<String>,
        "payload": Object {},
        "type": "football/startHalf",
      }
    `
    );

    await ts.close();
  });

  test("resync (state mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/football`)
      .auth("test", "password")
      .send({
        name: "test",
        worthPoints: 0,
        startTime: "2022-05-29T00:00:00Z",
        homeTeam: "test",
        awayTeam: "test",
      });
    const testEvent = testEventRes.body;

    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?token=${testToken}`
    );
    await ts.waitForOpen();
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "HELLO");
    await ts.send({ kind: "SUBSCRIBE", to: `Event/football/${testEvent.id}` });
    await expect(ts.waitForMessage()).resolves.toHaveProperty(
      "kind",
      "SUBSCRIBE_OK"
    );

    const resyncRes = await request
      .post(
        `http://localhost:${testPort}/api/events/football/${testEvent.id}/_resync`
      )
      .auth("test", "password")
      .send({});
    expect(resyncRes.statusCode).toBe(200);

    const message = await ts.waitForMessage();
    expect(message).toMatchInlineSnapshot(
      {
        kind: "CHANGE",
        mid: expect.any(String),
        changed: expect.any(String),
        data: {
          id: expect.any(String),
        },
      },
      `
      Object {
        "changed": Any<String>,
        "data": Object {
          "awayTeam": Object {
            "abbreviation": "TEST",
            "crestAttachmentID": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "name": "Test",
            "primaryColour": "#000000",
            "secondaryColour": "#fafafa",
            "slug": "test",
          },
          "clock": Object {
            "state": "stopped",
            "timeLastStartedOrStopped": 0,
            "type": "upward",
            "wallClockLastStarted": 0,
          },
          "halves": Array [],
          "homeTeam": Object {
            "abbreviation": "TEST",
            "crestAttachmentID": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "name": "Test",
            "primaryColour": "#000000",
            "secondaryColour": "#fafafa",
            "slug": "test",
          },
          "id": Any<String>,
          "name": "test",
          "notCovered": false,
          "players": Object {
            "away": Array [],
            "home": Array [],
          },
          "scoreAway": 0,
          "scoreHome": 0,
          "startTime": "2022-05-29T00:00:00Z",
          "type": "football",
          "worthPoints": 0,
        },
        "kind": "CHANGE",
        "mid": Any<String>,
      }
    `
    );

    await ts.close();
  });

  test("resync (actions mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/football`)
      .auth("test", "password")
      .send({
        name: "test",
        worthPoints: 0,
        startTime: "2022-05-29T00:00:00Z",
        homeTeam: "test",
        awayTeam: "test",
      });
    const testEvent = testEventRes.body;

    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?mode=actions&token=${testToken}`
    );
    await ts.waitForOpen();
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "HELLO");
    await ts.send({ kind: "SUBSCRIBE", to: `Event/football/${testEvent.id}` });
    await expect(ts.waitForMessage()).resolves.toHaveProperty(
      "kind",
      "SUBSCRIBE_OK"
    );

    const resyncRes = await request
      .post(
        `http://localhost:${testPort}/api/events/football/${testEvent.id}/_resync`
      )
      .auth("test", "password")
      .send({});
    expect(resyncRes.statusCode).toBe(200);

    const message = await ts.waitForMessage();
    expect(message.actions).toHaveLength(1);
    expect(message).toMatchInlineSnapshot(
      {
        event: expect.any(String),
        actions: [
          {
            meta: {
              ts: expect.any(Number),
            },

            payload: {
              id: expect.any(String),
            },
          },
        ],
      },
      `
      Object {
        "actions": Array [
          Object {
            "meta": Object {
              "ts": Any<Number>,
            },
            "payload": Object {
              "awayTeam": Object {
                "abbreviation": "TEST",
                "crestAttachmentID": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "name": "Test",
                "primaryColour": "#000000",
                "secondaryColour": "#fafafa",
                "slug": "test",
              },
              "clock": Object {
                "state": "stopped",
                "timeLastStartedOrStopped": 0,
                "type": "upward",
                "wallClockLastStarted": 0,
              },
              "halves": Array [],
              "homeTeam": Object {
                "abbreviation": "TEST",
                "crestAttachmentID": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "name": "Test",
                "primaryColour": "#000000",
                "secondaryColour": "#fafafa",
                "slug": "test",
              },
              "id": Any<String>,
              "name": "test",
              "notCovered": false,
              "players": Object {
                "away": Array [],
                "home": Array [],
              },
              "scoreAway": 0,
              "scoreHome": 0,
              "startTime": "2022-05-29T00:00:00Z",
              "type": "football",
              "worthPoints": 0,
            },
            "type": "@@init",
          },
        ],
        "event": Any<String>,
        "kind": "BULK_ACTIONS",
      }
    `
    );

    await ts.close();
  });

  test("edits to teams are reflected as changes (state mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/football`)
      .auth("test", "password")
      .send({
        name: "test",
        worthPoints: 0,
        startTime: "2022-05-29T00:00:00Z",
        homeTeam: "test",
        awayTeam: "test",
      });
    const testEvent = testEventRes.body;

    // Mock out the query in teamsRepo.ts
    const DB = require("./db").DB as unknown as InMemoryDB;
    DB.query
      // resyncTeamUpdates
      .mockResolvedValueOnce({
        rows: [`EventMeta/football/${testEvent.id}`],
      })
      // cleanupOrphanedAttachments
      .mockResolvedValue({ rows: [] });

    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?token=${testToken}`
    );
    await ts.waitForOpen();
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "HELLO");
    await ts.send({ kind: "SUBSCRIBE", to: `Event/football/${testEvent.id}` });
    await expect(ts.waitForMessage()).resolves.toHaveProperty(
      "kind",
      "SUBSCRIBE_OK"
    );

    expect(
      request
        .put(`http://localhost:${testPort}/api/teams/test`)
        .send({
          name: "Updated Test",
          abbreviation: "FOO",
          primaryColour: "#000000",
          secondaryColour: "#fafafa",
        } as TeamInfo)
        .auth("test", "password")
        .send({})
    ).resolves.toHaveProperty("status", 200);

    const message = await ts.waitForMessage(50, true);
    expect(message).toMatchInlineSnapshot(
      {
        kind: "CHANGE",
        mid: expect.any(String),
        changed: expect.any(String),
        data: {
          id: expect.any(String),
        },
      },
      `
      Object {
        "changed": Any<String>,
        "data": Object {
          "awayTeam": Object {
            "abbreviation": "TEST",
            "crestAttachmentID": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "name": "Test",
            "primaryColour": "#000000",
            "secondaryColour": "#fafafa",
            "slug": "test",
          },
          "clock": Object {
            "state": "stopped",
            "timeLastStartedOrStopped": 0,
            "type": "upward",
            "wallClockLastStarted": 0,
          },
          "halves": Array [],
          "homeTeam": Object {
            "abbreviation": "TEST",
            "crestAttachmentID": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "name": "Test",
            "primaryColour": "#000000",
            "secondaryColour": "#fafafa",
            "slug": "test",
          },
          "id": Any<String>,
          "name": "test",
          "notCovered": false,
          "players": Object {
            "away": Array [],
            "home": Array [],
          },
          "scoreAway": 0,
          "scoreHome": 0,
          "startTime": "2022-05-29T00:00:00Z",
          "type": "football",
          "worthPoints": 0,
        },
        "kind": "CHANGE",
        "mid": Any<String>,
      }
    `
    );
    await ts.close();
  });

  test("edits to teams are reflected as changes (actions mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/football`)
      .auth("test", "password")
      .send({
        name: "test",
        worthPoints: 0,
        startTime: "2022-05-29T00:00:00Z",
        homeTeam: "test",
        awayTeam: "test",
      });
    const testEvent = testEventRes.body;

    // Mock out the query in teamsRepo.ts
    const DB = require("./db").DB as unknown as InMemoryDB;
    DB.query
      // resyncTeamUpdates
      .mockResolvedValueOnce({
        rows: [`EventMeta/football/${testEvent.id}`],
      })
      // cleanupOrphanedAttachments
      .mockResolvedValueOnce({ rows: [] });

    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?mode=actions&token=${testToken}`
    );
    await ts.waitForOpen();
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "HELLO");
    await ts.send({ kind: "SUBSCRIBE", to: `Event/football/${testEvent.id}` });
    await expect(ts.waitForMessage()).resolves.toHaveProperty(
      "kind",
      "SUBSCRIBE_OK"
    );

    expect(
      request
        .put(`http://localhost:${testPort}/api/teams/test`)
        .send({
          name: "Updated Test",
          abbreviation: "FOO",
          primaryColour: "#000000",
          secondaryColour: "#fafafa",
        } as TeamInfo)
        .auth("test", "password")
        .send({})
    ).resolves.toHaveProperty("status", 200);

    const message = await ts.waitForMessage(50, true);
    expect(message).toMatchInlineSnapshot(
      {
        kind: "ACTION",
        event: expect.any(String),
        mid: expect.any(String),
        meta: {
          ts: expect.any(Number),
        },

        payload: {
          id: expect.any(String),
        },
      },
      `
      Object {
        "event": Any<String>,
        "kind": "ACTION",
        "meta": Object {
          "ts": Any<Number>,
        },
        "mid": Any<String>,
        "payload": Object {
          "awayTeam": Object {
            "abbreviation": "FOO",
            "crestAttachmentID": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "name": "Updated Test",
            "primaryColour": "#000000",
            "secondaryColour": "#fafafa",
            "slug": "updated-test",
          },
          "homeTeam": Object {
            "abbreviation": "FOO",
            "crestAttachmentID": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "name": "Updated Test",
            "primaryColour": "#000000",
            "secondaryColour": "#fafafa",
            "slug": "updated-test",
          },
          "id": Any<String>,
          "name": "test",
          "notCovered": false,
          "startTime": "2022-05-29T00:00:00Z",
          "type": "football",
          "worthPoints": 0,
        },
        "type": "@@edit",
      }
    `
    );
    await ts.close();
  });
});
