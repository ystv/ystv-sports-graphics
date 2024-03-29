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
import request from "superagent";
import { League, TeamInfo } from "../common/types";
import { createTeamsRouter } from "./teamsRoutes";
import { DB } from "./db";
import { TestSocket } from "./testUtils";

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
    const testLeague: League = {
      name: "Test League",
      slug: "test-league",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    };
    await DB.collection("_default").insert("League/test-league", testLeague);
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

  test("receives event updates (state mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/test-league/football`)
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
    await ts.send({
      kind: "SUBSCRIBE",
      to: `Event/test-league/football/${testEvent.id}`,
    });
    await expect(ts.waitForMessage()).resolves.toHaveProperty(
      "kind",
      "SUBSCRIBE_OK"
    );

    const actionRes = await request
      .post(
        `http://localhost:${testPort}/api/events/test-league/football/${testEvent.id}/startHalf`
      )
      .auth("test", "password")
      .send({});
    expect(actionRes.statusCode).toBe(200);

    const message = await ts.waitForMessage();
    expect(message).toMatchSnapshot({
      kind: "CHANGE",
      changed: expect.any(String),
      mid: expect.any(String),
      data: {
        clock: {
          wallClockLastStarted: expect.any(Number),
        },

        id: expect.any(String),
      },
    });

    await ts.close();
  });

  test("receives event updates (actions mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/test-league/football`)
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
    await ts.send({
      kind: "SUBSCRIBE",
      to: `Event/test-league/football/${testEvent.id}`,
    });
    await expect(ts.waitForMessage()).resolves.toHaveProperty(
      "kind",
      "SUBSCRIBE_OK"
    );

    const actionRes = await request
      .post(
        `http://localhost:${testPort}/api/events/test-league/football/${testEvent.id}/startHalf`
      )
      .auth("test", "password")
      .send({});
    expect(actionRes.statusCode).toBe(200);

    const message = await ts.waitForMessage();
    expect(message).toMatchSnapshot({
      kind: "ACTION",
      event: expect.any(String),
      mid: expect.any(String),
      meta: {
        ts: expect.any(Number),
      },
    });

    await ts.close();
  });

  test("resync (state mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/test-league/football`)
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
    await ts.send({
      kind: "SUBSCRIBE",
      to: `Event/test-league/football/${testEvent.id}`,
    });
    await expect(ts.waitForMessage()).resolves.toHaveProperty(
      "kind",
      "SUBSCRIBE_OK"
    );

    const resyncRes = await request
      .post(
        `http://localhost:${testPort}/api/events/test-league/football/${testEvent.id}/_resync`
      )
      .auth("test", "password")
      .send({});
    expect(resyncRes.statusCode).toBe(200);

    const message = await ts.waitForMessage();
    expect(message).toMatchSnapshot({
      kind: "CHANGE",
      mid: expect.any(String),
      changed: expect.any(String),
      data: {
        id: expect.any(String),
      },
    });

    await ts.close();
  });

  test("resync (actions mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/test-league/football`)
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
    await ts.send({
      kind: "SUBSCRIBE",
      to: `Event/test-league/football/${testEvent.id}`,
    });
    await expect(ts.waitForMessage()).resolves.toHaveProperty(
      "kind",
      "SUBSCRIBE_OK"
    );

    const resyncRes = await request
      .post(
        `http://localhost:${testPort}/api/events/test-league/football/${testEvent.id}/_resync`
      )
      .auth("test", "password")
      .send({});
    expect(resyncRes.statusCode).toBe(200);

    const message = await ts.waitForMessage();
    expect(message.actions).toHaveLength(1);
    expect(message).toMatchSnapshot({
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
    });

    await ts.close();
  });

  test("edits to teams are reflected as changes (state mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/test-league/football`)
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
        rows: [`EventMeta/test-league/football/${testEvent.id}`],
      })
      // cleanupOrphanedAttachments
      .mockResolvedValue({ rows: [] });

    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?token=${testToken}`
    );
    await ts.waitForOpen();
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "HELLO");
    await ts.send({
      kind: "SUBSCRIBE",
      to: `Event/test-league/football/${testEvent.id}`,
    });
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
    expect(message).toMatchSnapshot({
      kind: "CHANGE",
      mid: expect.any(String),
      changed: expect.any(String),
      data: {
        id: expect.any(String),
      },
    });
    await ts.close();
  });

  test("edits to teams are reflected as changes (actions mode)", async () => {
    const testEventRes = await request
      .post(`http://localhost:${testPort}/api/events/test-league/football`)
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
        rows: [`EventMeta/test-league/football/${testEvent.id}`],
      })
      // cleanupOrphanedAttachments
      .mockResolvedValueOnce({ rows: [] });

    const ts = new TestSocket(
      `ws://localhost:${testPort}/api/updates/stream/v2?mode=actions&token=${testToken}`
    );
    await ts.waitForOpen();
    await expect(ts.waitForMessage()).resolves.toHaveProperty("kind", "HELLO");
    await ts.send({
      kind: "SUBSCRIBE",
      to: `Event/test-league/football/${testEvent.id}`,
    });
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
    expect(message).toMatchSnapshot({
      kind: "ACTION",
      event: expect.any(String),
      mid: expect.any(String),
      meta: {
        ts: expect.any(Number),
      },

      payload: {
        id: expect.any(String),
      },
    });
    await ts.close();
  });
});
