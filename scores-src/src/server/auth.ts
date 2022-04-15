import { DB } from "./db";
import { verify, hash } from "argon2";
import { DocumentExistsError, DocumentNotFoundError } from "couchbase";
import { NextFunction, Request, Router, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import invariant from "tiny-invariant";
import { ensure } from "./errs";
import { Unauthorized, Forbidden, BadRequest } from "http-errors";
import { randomUUID } from "crypto";
import { isBootstrapped } from "./bootstrap";

export type Permission = "SUDO" | "read" | "write" | "admin";

export interface User {
  username: string;
  passwordHash?: string;
  permissions: Permission[];
}

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

async function getUserForSession(sesionID: string): Promise<User> {
  try {
    const sessionDoc = await DB.collection("_default").get(
      `Session/${sesionID}`
    );
    const userDoc = await DB.collection("_default").get(
      `User/${sessionDoc.content as string}`
    );
    return userDoc.content as User;
  } catch (e) {
    if (e instanceof DocumentNotFoundError) {
      throw new Forbidden("Invalid session");
    }
    throw e;
  }
}

const cookieKey = "sports-graphics-session";

export async function verifyToken(token: string, permissions: Permission[]) {
  const user = await getUserForSession(token);
  const hasPerms =
    user.permissions.includes("SUDO") ||
    user.permissions.some((x) => permissions.includes(x));
  ensure(hasPerms, Forbidden, "insufficient permissions");
  return user;
}

export function authenticate(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ((await isBootstrapped()) !== true) {
        throw new Forbidden("Server is not yet bootstrapped");
      }
      let user: User;
      ensure(!!req.headers, BadRequest, "no headers?");
      const authHeader = req.headers["authorization"];
      if (authHeader) {
        const [scheme, ...rest] = authHeader.split(" ");
        switch (scheme) {
          case "Bearer": {
            ensure(rest.length > 0, Unauthorized, "missing token");
            const token = rest[0];
            user = await getUserForSession(token);
            break;
          }
          case "Basic": {
            ensure(rest.length > 0, Unauthorized, "missing credentials");
            const [username, password] = Buffer.from(rest[0], "base64")
              .toString("utf-8")
              .split(":");
            user = await authenticateUser(username, password);
            break;
          }
          default:
            throw new Unauthorized("invalid auth scheme");
        }
      } else {
        ensure(req.cookies, Unauthorized, "no cookies");
        const cookie = req.cookies[cookieKey];
        ensure(typeof cookie === "string", Unauthorized, "no session");
        user = await getUserForSession(cookie);
      }
      const hasPerms =
        user.permissions.includes("SUDO") ||
        user.permissions.some((x) => permissions.includes(x));
      ensure(hasPerms, Forbidden, "insufficient permissions");
      req.user = user;
      next();
    } catch (e) {
      const bootstrapState = await isBootstrapped();
      if (bootstrapState !== true) {
        res.status(401).json({
          ok: false,
          needsBootstrap: true,
        });
        return;
      }
      if (e instanceof Unauthorized) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Sports Graphics"');
      }
      next(e);
    }
  };
}

const sessionTTLSeconds = 60 * 60 * 24 * 7;

async function createSessionForUser(username: string): Promise<string> {
  for (;;) {
    try {
      const sid = randomUUID();
      await DB.collection("_default").insert(`Session/${sid}`, username, {
        expiry: sessionTTLSeconds,
      });
      return sid;
    } catch (e) {
      if (e instanceof DocumentExistsError) {
        continue;
      }
      throw e;
    }
  }
}

export async function createLocalUser(
  username: string,
  password: string
): Promise<User> {
  const pwHash = await hash(password);
  const data: User = {
    username,
    passwordHash: pwHash,
    permissions: ["SUDO"],
  };
  await DB.collection("_default").insert(`User/${username}`, data);
  return data;
}

async function authenticateUser(
  username: string,
  password: string
): Promise<User> {
  const userRes = await DB.collection("_default").get(`User/${username}`);
  const user = userRes.content as User;
  const valid = await verify(user.passwordHash ?? "", password);
  if (!valid) {
    throw new Unauthorized("Incorrect username or password");
  }
  delete user.passwordHash;
  return user;
}

export function createAuthRouter() {
  const router = Router();

  router.get(
    "/me",
    authenticate(),
    expressAsyncHandler(async (req, res) => {
      invariant(
        typeof req.user !== "undefined",
        "made it into /me without a user"
      );
      res.status(200).json(req.user);
    })
  );

  router.post(
    "/login/local",
    expressAsyncHandler(async (req, res) => {
      const { username, password } = req.body;
      ensure(typeof username === "string", BadRequest, "no username");
      ensure(typeof password === "string", BadRequest, "no password");
      const user = await authenticateUser(username, password);
      const sid = await createSessionForUser(username);
      res.cookie(cookieKey, sid, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: sessionTTLSeconds,
      });
      res.status(200).json({
        ok: true,
        user,
        token: sid,
      });
    })
  );

  return router;
}
