import { Action } from "./eventStateHelpers";

export type LiveClientMessage =
  | {
      kind: "SUBSCRIBE";
      to: string;
    }
  | {
      kind: "UNSUBSCRIBE";
      to: string;
    }
  | { kind: "RESYNC"; what: string }
  | {
      kind: "PING";
    }
  | { kind: "PONG" };

export type LiveServerMessage =
  | {
      kind: "HELLO";
      sid: string;
      subs: string[];
      mode: "state" | "actions";
    }
  | {
      kind: "CHANGE";
      changed: string;
      mid: string;
      data: Record<string, unknown>;
    }
  | {
      kind: "ACTION";
      mid: string;
      event: string;
      type: string;
      payload: Record<string, unknown>;
      meta: {
        ts: number;
      };
    }
  | {
      kind: "BULK_ACTIONS";
      event: string;
      actions: Action[];
    }
  | {
      kind: "SUBSCRIBE_OK";
      to: string;
      current: Record<string, unknown> | Action[];
    }
  | {
      kind: "UNSUBSCRIBE_OK";
      to: string;
    }
  | {
      kind: "ERROR";
      error: string;
    }
  | {
      kind: "PING";
    }
  | { kind: "PONG" };
