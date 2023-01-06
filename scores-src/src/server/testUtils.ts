import { once } from "events";
import invariant from "tiny-invariant";
import { WebSocket } from "ws";

/**
 * A wrapper around a WebSocket that provides a few methods to help testing.
 * It lets the test wait for a message to arrive using the waitForMessage() method.
 */
export class TestSocket {
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
