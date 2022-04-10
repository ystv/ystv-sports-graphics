import config from "./config";
import winston from "winston";

const whitespace = /\s/;
const makeLogfmt = (properties: Record<string, unknown>, escapeJSON = true) =>
  Object.keys(properties)
    .map((prop) => {
      const value = properties[prop];
      const valueStr =
        typeof value === "string" ? value : JSON.stringify(value);
      const valueFmt =
        whitespace.test(valueStr) || valueStr.length === 0
          ? `"${escapeJSON ? valueStr.replaceAll(`"`, `\\"`) : valueStr}"`
          : value;
      return `${prop}=${valueFmt}`;
    })
    .join(" ");

const format = winston.format.combine(
  winston.format.timestamp(),
  process.env.NODE_ENV === "production"
    ? winston.format.printf(({ level, message, timestamp, name, ...meta }) =>
        makeLogfmt({ timestamp, level, name, message, ...meta })
      )
    : winston.format.printf(({ level, message, timestamp, name, ...rest }) => {
        let restStr = "";
        if (Object.keys(rest).length > 0) {
          restStr = `\n\t ${makeLogfmt(rest, false)}`;
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
