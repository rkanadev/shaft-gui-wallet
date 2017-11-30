'use strict';
const {createLogger, format, transports} = require('winston');
const {combine, timestamp, label, printf} = format;
const defaultLogLevel = 'info';
let logLevel = defaultLogLevel;

let loggers = [];

const myFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});


module.exports = {
    initFileLogger: function (pathToLogFile) {
        loggers.forEach((logger) => logger.add(new transports.File({filename: pathToLogFile, level: logLevel})))
    },
    getLogger: function (loggerName) {
        let logger = createLogger({
            format: format.combine(
                label({label: loggerName}),
                timestamp(),
                myFormat
            ),
            level: logLevel,
            transports: [new transports.Console()
            ],
        });
        loggers.push(logger);
        return logger;
    },
    changeLogLevel: function (_logLevel) {
        logLevel = _logLevel;
        loggers.forEach(logger => logger.transports.forEach(transport => transport.level = logLevel));
    }
};