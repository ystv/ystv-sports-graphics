import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { NextFunction, Request, Response } from "express";
import { isHttpError } from "http-errors";
import { MulterError } from "multer";
import { Logger } from "winston";
import { ValidationError } from "yup";

export const errorHandler: (
  log: Logger
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => (err: any, req: Request, res: Response, next: NextFunction) => any =
  (httpLogger) => (err, req, res, next) => {
    let code: number;
    let message: string;
    let extra = {};

    if (!isHttpError(err) && !(err instanceof ValidationError)) {
      let errType: string;
      let errMsg: string;
      if (err instanceof Error) {
        errType = err.name;
        errMsg = err.message + " " + JSON.stringify(err.stack);
      } else {
        errType = typeof err;
        errMsg = JSON.stringify(err);
      }
      httpLogger.error(`Uncaught handler error`, {
        url: req.baseUrl,
        type: errType,
        error: errMsg,
      });
    }

    /* istanbul ignore else */
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2001") {
      code = 404;
      message = "entity not found";
    } else if (isHttpError(err)) {
      code = err.statusCode;
      message = err.message;
    } else if (err instanceof ValidationError) {
      code = 422;
      message = "invalid payload: " + err.errors.join("; ");
      extra = {
        errors: err.inner.map((err) => ({
          path: err.path,
          type: err.type,
          message: err.message,
        })),
      };
    } else if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
      code = 422;
      message = `file ${err.field} too large`;
    } else if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test"
    ) {
      code = 500;
      message = "internal server error";
      if (err instanceof Error) {
        extra = {
          name: err.name,
          message: err.message,
          stack: err.stack,
        };
      } else {
        extra = JSON.parse(JSON.stringify(err));
      }
    } else {
      code = 500;
      message = "internal server error, sorry";
    }
    res.statusCode = code;
    res.json({
      ...extra,
      error: message,
      cat: `https://http.cat/${code}.jpg`,
    });
  };
