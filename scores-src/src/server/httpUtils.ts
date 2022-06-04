import {
  DocumentNotFoundError,
  DocumentLockedError,
  CasMismatchError,
} from "couchbase";
import { NextFunction, Request, Response } from "express";
import { isHttpError } from "http-errors";
import { MulterError, ErrorCode as MulterErrorCode } from "multer";
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

    if (err instanceof DocumentNotFoundError) {
      code = 404;
      message = "entity not found";
    } else if (
      err instanceof DocumentLockedError ||
      err instanceof CasMismatchError
    ) {
      code = 409;
      message = "someone edited that at the same time as you";
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
