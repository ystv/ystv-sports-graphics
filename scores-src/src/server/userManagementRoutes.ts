import { Router } from "express";
import asyncHandler from "express-async-handler";
import * as Yup from "yup";
import { BadRequest, Conflict } from "http-errors";
import { Permission, User } from "../common/types";
import { authenticate, createLocalUser } from "./auth";
import { DB } from "./db";
import { ensure } from "./errs";
import { hash } from "argon2";

export function createUserManagementRouter() {
  const router = Router();

  router.get(
    "/",
    authenticate("admin"),
    asyncHandler(async (req, res) => {
      const rows = await DB.query(
        `SELECT RAW u FROM _default u WHERE meta(u).id LIKE 'User/%'`
      );
      const result: User[] = [];
      for (const row of rows.rows) {
        const val: User = row;
        delete val.passwordHash;
        result.push(val);
      }
      res.status(200).json(result);
    })
  );

  router.get(
    "/:id",
    authenticate("admin"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      ensure(typeof id === "string", BadRequest, "missing id");
      const data = await DB.collection("_default").get(`User/${id}`);
      const user: User = data.content;
      delete user.passwordHash;
      res.status(200).json({
        ...user,
        _cas: data.cas,
      });
    })
  );

  const CreateUserSchema = Yup.object({
    username: Yup.string().required(),
    permissions: Yup.array()
      .of(
        Yup.mixed<Permission>()
          .oneOf(["admin", "read", "write", "SUDO"])
          .required()
      )
      .required(),
  });

  router.post(
    "/",
    authenticate("admin"),
    asyncHandler(async (req, res) => {
      const data = await CreateUserSchema.shape({
        password: Yup.string().required(),
      }).validate(req.body, {
        abortEarly: false,
      });
      const result = await createLocalUser(
        data.username,
        data.password,
        data.permissions
      );
      res.status(201).json(result);
    })
  );

  const EditUserSchema = CreateUserSchema.shape({
    _cas: Yup.string().optional(),
  });

  router.put(
    "/:username",
    authenticate("admin"),
    asyncHandler(async (req, res) => {
      const username = req.params.username;
      ensure(typeof username === "string", BadRequest, "missing username");
      const id = `User/${username}`;
      const payload = await EditUserSchema.validate(req.body, {
        abortEarly: false,
      });
      const newData: User = {
        username: payload.username,
        permissions: payload.permissions,
      };
      const data = await DB.collection("_default").getAndLock(id, 10);
      try {
        if (payload._cas && data.cas != payload._cas) {
          throw new Conflict("someone else has updated this user");
        }
        newData.passwordHash = data.content.passwordHash;
        await DB.collection("_default").replace(id, newData, {
          cas: data.cas,
        });
        delete newData.passwordHash;
        res.status(200).json(newData);
      } catch (e) {
        await DB.collection("_default").unlock(id, data.cas);
        throw e;
      }
    })
  );

  const ResetPasswordPayload = Yup.object({
    password: Yup.string().required(),
  });

  router.put(
    "/:username/password",
    authenticate("admin"),
    asyncHandler(async (req, res) => {
      const username = req.params.username;
      ensure(typeof username === "string", BadRequest, "missing username");
      const payload = await ResetPasswordPayload.validate(req.body, {
        abortEarly: false,
      });
      const id = `User/${username}`;
      console.log(id);
      const dbRes = await DB.collection("_default").getAndLock(id, 10);
      try {
        const data: User = dbRes.content;
        data.passwordHash = await hash(payload.password);
        await DB.collection("_default").replace(id, data, {
          cas: dbRes.cas,
        });
        delete data.passwordHash;
        res.status(200).json(data);
      } catch (e) {
        await DB.collection("_default").unlock(id, dbRes.cas);
        throw e;
      }
    })
  );

  router.delete(
    "/:id",
    authenticate("admin"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      ensure(typeof id === "string", BadRequest, "missing id");
      await DB.collection("_default").remove(`User/${id}`);
      res.status(204).json();
    })
  );

  return router;
}
