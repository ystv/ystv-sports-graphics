import { DB } from "./db";
import { verify, hash } from "argon2";
import {
  DocumentExistsError,
  DocumentNotFoundError,
  GetResult,
} from "couchbase";
import { NextFunction, Request, Router, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import invariant from "tiny-invariant";
import { ensure } from "./errs";
import { Unauthorized, Forbidden, BadRequest } from "http-errors";
import { randomUUID } from "crypto";
import { isBootstrapped } from "./bootstrap";
import { Permission, User } from "../common/types";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

/**
 * getUserForSession matches the given session ID to a user.
 * @param sesionID
 * @returns
 * @throws Forbidden if the session ID does not match to a user.
 */
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

/**
 * verifyToken validates that the given session ID is valid and the user
 * it corresponds to has the requested permissions.
 * @param sessionID
 * @param permissions
 * @returns User
 * @throws Unauthorized
 * @throws Forbidden
 */
export async function verifySessionID(
  sessionID: string,
  permissions: Permission[]
) {
  const user = await getUserForSession(sessionID);
  const hasPerms =
    user.permissions.includes("SUDO") ||
    user.permissions.some((x) => permissions.includes(x));
  ensure(hasPerms, Forbidden, "insufficient permissions");
  return user;
}

/**
 * Popping up the browser's auth dialog is a bit annoying, so let the
 * UI detect the 401 and show its login prompt.
 */
const requestersToNotSendWWWAuthenticateFor = new Set([
  "xmlhttprequest",
  "fetch",
]);

async function findUserFromAuthHeader(value: string): Promise<User> {
  const [scheme, ...rest] = value.split(" ");
  switch (scheme) {
    case "Bearer": {
      ensure(rest.length > 0, Unauthorized, "missing token");
      const token = rest[0];
      return await getUserForSession(token);
    }
    case "Basic": {
      ensure(rest.length > 0, Unauthorized, "missing credentials");
      const [username, ...password] = Buffer.from(rest[0], "base64")
        .toString("utf-8")
        .split(":");
      return await authenticateUser(username, password.join(":"));
    }
    default:
      throw new Unauthorized("invalid auth scheme");
  }
}

/**
 * authenticate creates an Express middleware that will authenticate the user,
 * setting `req.user`, and verify if they have the required permissions.
 * If not, it will abort the request.
 * @param permissions
 * @returns
 * @example
 *   router.get("/foo", authenticate("read"), (req, res) => {...})
 */
export function authenticate(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ((await isBootstrapped()) !== true) {
        throw new Forbidden("Server is not yet bootstrapped");
      }

      ensure(!!req.headers, BadRequest, "no headers?");
      const authHeader = req.headers["authorization"];
      const cookie: string | undefined = (req.cookies ?? {})[cookieKey];
      let user: User;

      if (authHeader?.length) {
        user = await findUserFromAuthHeader(authHeader);
      } else if (cookie?.length) {
        user = await getUserForSession(cookie);
      } else {
        ensure(false, Unauthorized, "no credentials supplied");
      }

      const hasPerms =
        permissions.length === 0 ||
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

      let requester = req.headers["x-requested-with"] ?? "";
      if (Array.isArray(requester)) {
        requester = requester[0];
      }
      if (
        e instanceof Unauthorized &&
        !requestersToNotSendWWWAuthenticateFor.has(requester.toLowerCase())
      ) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Sports Graphics"');
      }
      next(e);
    }
  };
}

const sessionTTLSeconds = 60 * 60 * 24 * 7;

/**
 * createSessionForUser creates a session for the given user, assuming that they
 * have already been authenticated.
 * @param username
 * @returns the session ID
 */
export async function createSessionForUser(username: string): Promise<string> {
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

/**
 * createLocalUser creates a username/password user in the database.
 * @param username
 * @param password
 * @returns User
 * @throws couchbase.DocumentExistsError if the username is already taken
 */
export async function createLocalUser(
  username: string,
  password: string,
  permissions: Permission[]
): Promise<User> {
  const pwHash = await hash(password);
  const data: User = {
    username,
    passwordHash: pwHash,
    permissions,
  };
  await DB.collection("_default").insert(`User/${username}`, data);
  delete data.passwordHash;
  return data;
}

/**
 * authenticateUser finds a user for the given username and verifies the
 * provided password is correct.
 * @param username
 * @param password
 * @returns User
 * @throws Unauthorized if the username or password is incorrect
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<User> {
  let userRes: GetResult;
  try {
    userRes = await DB.collection("_default").get(`User/${username}`);
  } catch (e) {
    if (e instanceof DocumentNotFoundError) {
      throw new Unauthorized("User does not exist");
    }
    throw e;
  }
  const user = userRes.content as User;
  const valid = await verify(user.passwordHash ?? "", password);
  if (!valid) {
    throw new Unauthorized("Incorrect username or password");
  }
  delete user.passwordHash;
  return user;
}

export function setSessionCookie(res: Response, sid: string) {
  res.cookie(cookieKey, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: sessionTTLSeconds,
  });
}
