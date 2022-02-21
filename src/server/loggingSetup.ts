import config from "./config";
import logging from "loglevel";
import prefix from "loglevel-plugin-prefix";
prefix.reg(logging);
prefix.apply(logging, {
    template: '%t %l\t%n: ',
    timestampFormatter: date => date.toISOString(),
});

logging.setLevel(config.logLevel as any);

process.on("uncaughtException", err => {
    logging.error("Uncaught exception", err);
    process.exit(1);
});

process.on("unhandledRejection", rej => {
    logging.error("Unhandled promise rejection", rej);
    process.exit(1);
});

logging.getLogger("loggingSetup").info("Started & configured logging.");
