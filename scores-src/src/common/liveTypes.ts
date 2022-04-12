export type LiveClientMessage =
  | {
      kind: "SUBSCRIBE";
      to: string;
    }
  | {
      kind: "UNSUBSCRIBE";
      to: string;
    }
  | {
      kind: "PING";
    }
  | { kind: "PONG" };

export type LiveServerMessage =
  | {
      kind: "HELLO";
      sid: string;
      subs: string[];
    }
  | {
      kind: "CHANGE";
      changed: string;
      mid: string;
      data: Record<string, unknown>;
    }
  | {
      kind: "SUBSCRIBE_OK";
      to: string;
      current: Record<string, unknown>;
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
