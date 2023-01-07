// @vitest-environment happy-dom

import { describe, expect, test, beforeAll, beforeEach, vi, it } from "vitest";
import * as A from "./apiClient";
import "isomorphic-fetch";
import FormData from "form-data";
import { renderHook, waitFor } from "@testing-library/react";
import { createReadStream, readFileSync } from "fs";
import { resolve } from "path";
import invariant from "tiny-invariant";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

function integration(...args: Parameters<typeof describe>) {
  if (import.meta.env.INTEGRATION && import.meta.env.NODE_ENV === "test") {
    describe(...args);
  } else {
    describe.skip(...args);
  }
}

function isFile(f: unknown): f is { path: string; type: string } {
  return typeof f === "object" && f !== null && "path" in f && "type" in f;
}

integration("apiClient", () => {
  const API_BASE = (import.meta.env.PUBLIC_API_BASE as string) || "/api";
  beforeAll(async () => {
    try {
      await fetch(API_BASE);
    } catch (e) {
      throw new Error(`API server not running at ${API_BASE}`, {
        cause: e as Error,
      });
    }
  });
  async function setupReq(
    endpoint: string,
    method: string,
    status: number,
    bodyIn: Record<
      string,
      string | number | { path: string; type: string }
    > = {},
    token: string | boolean = false
  ): Promise<unknown> {
    const multipart = Object.values(bodyIn).some((x) => isFile(x));
    const headers = {} as Record<string, string>;
    if (!multipart) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    let body;
    if (method !== "get") {
      if (multipart) {
        body = new FormData();
        for (const [key, value] of Object.entries(bodyIn)) {
          if (isFile(value)) {
            body.append(key, createReadStream(value.path));
          } else {
            invariant(
              typeof value === "string",
              "body fields can only be strings or Files"
            );
            body.append(key, value);
          }
        }
      } else {
        body = JSON.stringify(bodyIn);
      }
    }
    const res = await fetch(API_BASE + endpoint, {
      method,
      headers,
      // @ts-expect-error isomorphic-fetch typing doesn't accept FormData in node for some reason
      body,
    });
    if (res.status !== status) {
      throw new Error(await res.text());
    }
    return await res.json();
  }
  let testEventID: string;
  beforeEach(async () => {
    await fetch(API_BASE + "/_test/resetDB", {
      method: "post",
    });
    await setupReq("/_test/createTestUser", "post", 200, {
      username: "admin",
      password: "password",
    });
    const res = (await setupReq("/auth/login/local", "post", 200, {
      username: "admin",
      password: "password",
    })) as { token: string; ok: true };
    expect(res).toHaveProperty("ok", true);
    expect(res).toHaveProperty("token");
    A.setAuthToken(res.token);
    await setupReq(
      "/leagues",
      "post",
      201,
      {
        name: "Test League",
        startDate: "2020-01-01",
        endDate: "2020-12-31",
      },
      res.token
    );

    await setupReq(
      "/teams",
      "post",
      201,
      {
        name: "Test",
        abbreviation: "TEST",
        primaryColour: "#000000",
        secondaryColour: "#ffffff",
        crest: {
          path: resolve(__dirname, "__fixtures__", "testCrest.svg"),
          type: "image/svg+xml",
        },
      },
      res.token
    );

    const createRes = await setupReq(
      "/events/test-league/football",
      "post",
      201,
      {
        name: "Test",
        worthPoints: 4,
        homeTeam: "test",
        awayTeam: "test",
      },
      res.token
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    testEventID = (createRes as any).id;
    // Wait for the server to catch up
    for (;;) {
      const events = (await setupReq(
        "/events/test-league",
        "get",
        200,
        undefined,
        res.token
      )) as unknown[];
      if (events.length > 0) {
        break;
      }
    }
  });

  test("useGETLeagues", async () => {
    const { result } = renderHook(() => A.useGETLeagues());
    expect(result.current).toHaveProperty("loading", true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toEqual({
      loading: false,
      data: [
        {
          name: "Test League",
          slug: "test-league",
          startDate: "2020-01-01",
          endDate: "2020-12-31",
        },
      ],
      error: undefined,
    });
  });

  test("usePOSTLeagues", async () => {
    const { result } = renderHook(() =>
      A.usePOSTLeagues()({
        name: "Test 2",
        startDate: "2022-01-01",
        endDate: "2022-12-31",
      })
    );
    const res = await result.current;
    expect(res).toMatchInlineSnapshot(`
      {
        "endDate": "2022-12-31",
        "name": "Test 2",
        "slug": "test-2",
        "startDate": "2022-01-01",
      }
    `);
  });

  test.todo("usePUTLeague");
  // test("usePUTLeague", async () => {
  //   const { result } = renderHook(() =>
  //     A.usePUTLeague()("test-league", {
  //       name: "Test 2",
  //       startDate: "2022-01-01",
  //       endDate: "2022-12-31",
  //     })
  //   );
  //   const res = await result.current;
  //   expect(res).toMatchInlineSnapshot(`
  //     {
  //       "endDate": "2022-12-31",
  //       "name": "Test 2",
  //       "slug": "test-league",
  //       "startDate": "2022-01-01",
  //     }
  //   `);
  // });
  test("useGETEvents", async () => {
    const { result } = renderHook(() => A.useGETEvents("test-league"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toHaveLength(1);
  });
  test("useGETEvent", async () => {
    const { result } = renderHook(() =>
      A.useGETEvent("test-league", "football", testEventID)
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toMatchObject({
      type: "football",
    });
  });
  test.todo("usePOSTEvents");
  test.todo("usePUTEvent");
  test.todo("usePOSTEventAction");
  test.todo("usePOSTEventUpdateAction");
  test("useGETBootstrapReady", async () => {
    const { result } = renderHook(() => A.useGETBootstrapReady());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.ready).toBe(true);
  });
  test.todo("usePOSTBootstrapCheckToken");
  test.todo("usePOSTBootstrap");
  test.todo("usePOSTLogin");
  test.todo("usePOSTEventUndo");
  test.todo("usePOSTEventRedo");
  test.todo("usePOSTEventDeclareWinner");
  test.todo("usePOSTEventResync");
  test("useGETAuthMe", async () => {
    const { result } = renderHook(() => A.useGETAuthMe());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toMatchObject({
      username: "admin",
    });
  });
  test("useGETUsers", async () => {
    const { result } = renderHook(() => A.useGETUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toHaveProperty("username", "admin");
  });
  test.todo("usePOSTUsers");
  test.todo("usePUTUsersUsername");
  test.todo("usePUTUsersUsernamePassword");
  test.todo("useDELETEUsersUsername");
  test("useGETTeams", async () => {
    const { result } = renderHook(() => A.useGETTeams());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toMatchObject({
      name: "Test",
      slug: "test",
    });
  });
  test.todo("usePOSTTeams");
  test.todo("usePUTTeams");
});
