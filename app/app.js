'use strict';
const loggerFactory = require('./util/logger');
const logger = loggerFactory.getLogger('App.js');
const gethNodeService = require('./service/gethNodeService');
const pathsService = require('./service/paths-service');
const version = require('../package.json').version;
const configService = require('./service/config-service');

function init() {
    return new Promise((resolve, reject) => {
        //Computing paths;
        //Checking and creating folders
        gethNodeService.checkOrCreateFolders().then(() => {
                configService.init();
                logger.debug('All folders seems to be exist or created, we may starting app.');
                let logPath = pathsService.getLogPath();
                logger.debug('Starting file logger in path ' + logPath);
                loggerFactory.initFileLogger(logPath);
                logger.info('SHAFT GUI Wallet started v' + version);
                logger.debug("Checking for local binaries");
                gethNodeService.init().then(proc => {
                    logger.debug('Successful start:' + proc);
                    resolve()
                }, err => {
                    logger.error('BAD ' + err);
                    reject(err);
                });
            },
            rej => reject(rej));
    })
}

module.exports = {
    init: init
};
