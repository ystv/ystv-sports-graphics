import { Router } from "express";
import asyncHandler from "express-async-handler";
import * as Yup from "yup";
import { BadRequest, Conflict } from "http-errors";
import { authenticate, createLocalUser } from "./auth";
import { ensure } from "./errs";
import { hash } from "argon2";
import { Permission, User } from "../generated/prisma/client";
import { UserNoPasswd } from "../common/types";
import { db } from "./db";

export function createUserManagementRouter() {
  const router = Router();

  router.get(
    "/",
    authenticate("admin"),
    asyncHandler(async (req, res) => {
      const rows = await db.user.findMany({ omit: { passwordHash: true } });
      const result: UserNoPasswd[] = [];
      for (const row of rows) {
        const val: UserNoPasswd = row;
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
      const data = await db.user.findUniqueOrThrow({
        where: {
          username: id,
        },
        omit: {
          passwordHash: true,
        },
      });
      const user: UserNoPasswd = data;
      res.status(200).json({
        ...user,
      });
    })
  );

  const CreateUserSchema = Yup.object({
    username: Yup.string().required(),
    permissions: Yup.array()
      .of(
        Yup.mixed<Permission>()
          .oneOf(["admin", "read", "write", "SUDO", "dangerZone"])
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
      const newData: UserNoPasswd = {
        username: payload.username,
        permissions: payload.permissions,
      };
      const data = await db.user.findUniqueOrThrow({ where: { username } });
      await db.user.update({ where: { username }, data: newData });
      res.status(200).json(newData);
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
      const dbRes = await db.user.findUniqueOrThrow({
        where: { username },
        omit: { passwordHash: true },
      });

      const data: UserNoPasswd = dbRes;
      const passwordHash = await hash(payload.password);
      await db.user.update({ where: { username }, data: { passwordHash } });
      res.status(200).json(data);
    })
  );

  router.delete(
    "/:id",
    authenticate("admin"),
    asyncHandler(async (req, res) => {
      const username = req.params.id;
      ensure(typeof username === "string", BadRequest, "missing id");
      await db.user.delete({ where: { username } });
      res.status(204).json();
    })
  );

  return router;
}
