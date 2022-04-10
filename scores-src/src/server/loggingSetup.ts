import config from "./config";
import winston from "winston";
import { stringify } from "logfmt";

function logfmt(data: Record<string, unknown>) {
  for (const key of Object.keys(data)) {
    if (typeof data[key] !== "string") {
      data[key] = JSON.stringify(data[key]);
    }
  }
  return stringify(data);
}

const format = winston.format.combine(
  winston.format.timestamp(),
  process.env.NODE_ENV === "production"
    ? winston.format.printf(({ level, message, timestamp, name, ...meta }) =>
        logfmt({ timestamp, level, name, message, ...meta })
      )
    : winston.format.printf(({ level, message, timestamp, name, ...rest }) => {
        let restStr = "";
        if (Object.keys(rest).length > 0) {
          restStr = `\n\t ${logfmt(rest)}`;
        }
        return `${timestamp} ${level} ${name}: ${message}${restStr}`;
      })
);

const baseLogger = winston.createLogger({
  level: config.logLevel,
  transports: [new winston.transports.Console()],
  format,
});

process.on("uncaughtException", (err) => {
  baseLogger.error("Uncaught exception", err);
  process.exit(1);
});

process.on("unhandledRejection", (rej) => {
  baseLogger.error("Unhandled promise rejection", rej);
  process.exit(1);
});

export function getLogger(name: string) {
  return baseLogger.child({
    name,
  });
}

getLogger("loggingSetup").info("Started & configured logging.", {
  logLevel: config.logLevel,
});
