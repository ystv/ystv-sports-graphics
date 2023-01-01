// @vitest-environment happy-dom

import { describe, expect, test, beforeAll, beforeEach, vi, it } from "vitest";
import * as A from "./apiClient";
import { renderHook, waitFor } from "@testing-library/react";

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
    body: Record<string, unknown> = {},
    token: string | boolean = false
  ): Promise<unknown> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return await fetch(API_BASE + endpoint, {
      method,
      headers,
      body: JSON.stringify(body),
    }).then((r) => r.json());
  }
  beforeEach(async () => {
    await fetch(API_BASE + "/_test/resetDB", {
      method: "post",
    });
    await setupReq("/_test/createTestUser", "post", {
      username: "admin",
      password: "password",
    });
    const res = (await setupReq("/auth/login/local", "post", {
      username: "admin",
      password: "password",
    })) as { token: string; ok: true };
    expect(res).toHaveProperty("ok", true);
    expect(res).toHaveProperty("token");
    A.setAuthToken(res.token);
    await setupReq(
      "/leagues",
      "post",
      {
        name: "Test League",
        startDate: "2020-01-01",
        endDate: "2020-12-31",
      },
      res.token
    );
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
    expect(res).toEqual({
      name: "Test 2",
      slug: "test-2",
      startDate: "2022-01-01",
      endDate: "2022-12-31",
    });
  });

  it.todo("usePUTLeague");
  it.todo("useGETEvents");
  it.todo("useGETEvent");
  it.todo("usePOSTEvents");
  it.todo("usePUTEvent");
  it.todo("usePOSTEventAction");
  it.todo("usePOSTEventUpdateAction");
  it.todo("useGETBootstrapReady");
  it.todo("usePOSTBootstrapCheckToken");
  it.todo("usePOSTBootstrap");
  it.todo("usePOSTLogin");
  it.todo("usePOSTEventUndo");
  it.todo("usePOSTEventRedo");
  it.todo("usePOSTEventDeclareWinner");
  it.todo("usePOSTEventResync");
  it.todo("useGETAuthMe");
  it.todo("useGETUsers");
  it.todo("usePOSTUsers");
  it.todo("usePUTUsersUsername");
  it.todo("usePUTUsersUsernamePassword");
  it.todo("useDELETEUsersUsername");
  it.todo("useGETTeams");
  it.todo("usePOSTTeams");
  it.todo("usePUTTeams");
});
