/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="@types/jest" />

import { createSlice, Reducer } from "@reduxjs/toolkit";
import {
  Init,
  Redo,
  resolveEventState,
  Undo,
  wrapAction,
} from "./eventStateHelpers";
import { Action } from "./types";

const testSlice = createSlice({
  name: "test",
  initialState: {
    value: 0,
  },
  reducers: {
    increment(state) {
      state.value++;
    },
    decrement(state) {
      state.value--;
    },
  },
});

function testRES<TState>(
  baseReducer: Reducer,
  actions: Action | Action[],
  expected: TState
) {
  if (!Array.isArray(actions)) {
    actions = [actions];
  }
  const result = resolveEventState(baseReducer, actions);
  expect(result).toEqual(expected);
}

type AnyFunction = (...args: any[]) => any;

function incrementTimeAfterCalling<TFn extends AnyFunction>(
  fn: TFn,
  ...args: Parameters<TFn>
): ReturnType<TFn> {
  const now = new Date().valueOf();
  const result = fn(...args);
  jest.setSystemTime(new Date(now + 1000));
  return result;
}

describe("resolveEventState", () => {
  it("sanity check", () => {
    testRES(testSlice.reducer, [wrapAction(Init({ value: 0 }))], { value: 0 });
    testRES(
      testSlice.reducer,
      [
        wrapAction(Init({ value: 0 })),
        wrapAction(testSlice.actions.increment()),
      ],
      { value: 1 }
    );
    testRES(
      testSlice.reducer,
      [
        wrapAction(Init({ value: 0 })),
        wrapAction(testSlice.actions.increment()),
        wrapAction(testSlice.actions.decrement()),
      ],
      { value: 0 }
    );
  });
  describe("Undo / Redo", () => {
    beforeAll(() => {
      jest.useFakeTimers("modern");
      jest.setSystemTime(new Date(2022, 3, 16, 12, 0, 0));
    });

    afterAll(() => {
      jest.useRealTimers();
    });
    test("basic undo", () => {
      const actions = [
        incrementTimeAfterCalling(wrapAction, Init({ value: 0 })),
        incrementTimeAfterCalling(
          wrapAction,
          testSlice.actions.increment() as any
        ),
      ];
      actions.push(wrapAction(Undo({ ts: actions[1].meta.ts })));
      testRES(testSlice.reducer, actions, { value: 0 });
    });
    test("basic redo", () => {
      const actions = [
        incrementTimeAfterCalling(wrapAction, Init({ value: 0 })),
        incrementTimeAfterCalling(
          wrapAction,
          testSlice.actions.increment() as any
        ),
      ];
      actions.push(wrapAction(Undo({ ts: actions[1].meta.ts })));
      actions.push(wrapAction(Redo({ ts: actions[1].meta.ts })));
      testRES(testSlice.reducer, actions, { value: 1 });
    });
    test("out of order undo", () => {
      const actions = [
        incrementTimeAfterCalling(wrapAction, Init({ value: 0 })),
        incrementTimeAfterCalling(
          wrapAction,
          testSlice.actions.increment() as any
        ),
        incrementTimeAfterCalling(
          wrapAction,
          testSlice.actions.increment() as any
        ),
      ];
      actions.push(
        incrementTimeAfterCalling(wrapAction, Undo({ ts: actions[1].meta.ts }))
      );
      testRES(testSlice.reducer, actions, { value: 1 });
    });
    test("double undo", () => {
      const actions = [
        incrementTimeAfterCalling(wrapAction, Init({ value: 0 })),
        incrementTimeAfterCalling(
          wrapAction,
          testSlice.actions.increment() as any
        ),
        incrementTimeAfterCalling(
          wrapAction,
          testSlice.actions.increment() as any
        ),
      ];
      actions.push(
        incrementTimeAfterCalling(wrapAction, Undo({ ts: actions[1].meta.ts }))
      );
      actions.push(
        incrementTimeAfterCalling(wrapAction, Undo({ ts: actions[2].meta.ts }))
      );
      testRES(testSlice.reducer, actions, { value: 0 });
    });
    test("out of order redo", () => {
      const actions = [
        incrementTimeAfterCalling(wrapAction, Init({ value: 0 })),
        incrementTimeAfterCalling(
          wrapAction,
          testSlice.actions.increment() as any
        ),
      ];
      actions.push(
        incrementTimeAfterCalling(wrapAction, Undo({ ts: actions[1].meta.ts }))
      );
      actions.push(
        incrementTimeAfterCalling(
          wrapAction,
          testSlice.actions.increment() as any
        )
      );
      actions.push(
        incrementTimeAfterCalling(wrapAction, Redo({ ts: actions[1].meta.ts }))
      );
      testRES(testSlice.reducer, actions, { value: 2 });
    });
  });
});
