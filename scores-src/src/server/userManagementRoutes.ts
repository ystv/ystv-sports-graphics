import { Router } from "express";
import asyncHandler from "express-async-handler";
import * as Yup from "yup";
import { BadRequest } from "http-errors";
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
    password: Yup.string().required(),
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
      const data = await CreateUserSchema.validate(req.body, {
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
    "/:id",
    authenticate("admin"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      ensure(typeof id === "string", BadRequest, "missing id");
      const payload = await EditUserSchema.validate(req.body, {
        abortEarly: false,
      });
      const newData: User = {
        username: payload.username,
        passwordHash: await hash(payload.password),
        permissions: payload.permissions,
      };
      await DB.collection("_default").replace(`User/${id}`, newData, {
        cas: payload._cas,
      });
      delete newData.passwordHash;
      res.status(200).json(newData);
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
