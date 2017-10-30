'use strict';
const { createLogger, format, transports} = require('winston');
const {combine, timestamp, label, printf} = format;
const appConfig = require('../config/appConfig.json');
const logLevel = appConfig.log.level;


const myFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});


module.exports = {
    getLogger: function (loggerName) {
        return createLogger({
            format: format.combine(
                label({label: loggerName}),
                timestamp(),
                myFormat
            ),
            level: logLevel,
            transports: [new transports.Console()]
        });
    }
};