import fs from "fs";
import path from "path";
import winston from "winston";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// ===== Morgan section =====
// const levels = {
//   INFO: "INFO",
//   WARN: "WARN",
//   ERROR: "ERROR",
// };

// const getTimestamp = () => {
//   return new Date().toISOString();
// };

// const writeToFile = (message) => {
//   const filename = `logs/${new Date().toISOString().split("T")[0]}.log`;
//   fs.appendFileSync(filename, message + "\n");
// };

// const log = (level, message, data = null) => {
//   const timestamp = getTimestamp();
//   const logObj = {
//     timestamp,
//     level,
//     message,
//     ...(data && { data }),
//   };

//   const logStr = JSON.stringify(logObj);

//   if (level === levels.ERROR) {
//     console.error(logStr);
//   } else {
//     console.log(logStr);
//   }

//   writeToFile(logStr);
// };

// export const logger = {
//   info: (message, data) => log(levels.INFO, message, data),
//   warn: (message, data) => log(levels.WARN, message, data),
//   error: (message, data) => log(levels.ERROR, message, data),
// };
// ===== Morgan section =====

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...data }) => {
    const extra = Object.keys(data).length ? JSON.stringify(data) : "";
    return `${timestamp} [${level}] ${message} ${extra}`;
  }),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),

    new winston.transports.File({
      filename: "logs/app.log",
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
});

export default logger;
