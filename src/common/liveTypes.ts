export type LiveClientMessage =
  | {
      kind: "SUBSCRIBE";
      to: string;
    }
  | {
      kind: "UNSUBSCRIBE";
      to: string;
    };

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
      data: Record<string, any>;
    }
  | {
      kind: "SUBSCRIBE_OK";
      to: string;
      current: Record<string, any>;
    }
  | {
      kind: "UNSUBSCRIBE_OK";
      to: string;
    }
  | {
      kind: "ERROR";
      error: string;
    };
