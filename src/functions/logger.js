// src/functions/logger.js
import winston from "winston";

const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { service: "user-service" },
    transports: [
        // Console transport with color and simplicity
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        // File transport for errors
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        // File transport for all logs
        new winston.transports.File({ filename: "logs/combined.log" }),
    ],
});

export default logger;
