import morgan from "morgan";
import logger from "../utils/logger.js";

const format = ":method :url :status :response-time";

const stream = {
  write: (message) => {
    const trimmed = message.trim();
    const parts = trimmed.split(" ");
    const method = parts[0];
    const url = parts[1];
    const status = Number(parts[2]);
    const duration = `${parts[3]}ms`;

    const logMessage = `${method} ${url}`;
    const logData = { status, duration };

    if (status >= 500) {
      logger.error(logMessage, logData);
    } else if (status >= 400) {
      logger.warn(logMessage, logData);
    } else {
      logger.info(logMessage, logData);
    }
  },
};

export const httpLogger = morgan(format, {
  stream,
  skip: (req) => req.method === "OPTIONS",
});
