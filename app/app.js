'use strict';
const fs = require('fs');
const request = require('request');
const crypto = require('crypto');
const loggerFactory = require('./util/logger');
const logger = loggerFactory.getLogger('App.js');
const homeDir = process.env.HOME;
const shaftDir = '/.shaft-gui';
const binariesDir = '/binaries';
const builds = require('./config/builds.json');
const spawn = require('child_process').spawn;
const web3service = require('./service/web3service');
const gethNodeService = require('./service/gethNodeService');
const appConfig = require('./config/appConfig.json');
const version = require('../package.json').version;

function init() {

    return new Promise((resolve, reject) => {
        //Computing paths;
        let paths = gethNodeService.initPaths();

        //Checking and creating folders
        gethNodeService.checkOrCreateFolders(paths).then(() => {
                logger.debug('All folders seems to be exist or created, we may starting app.');
                let logPath = paths.homeDir + paths.shaftGUIDir + paths.logfile;
                logger.debug('Starting file logger in path ' + logPath);
                loggerFactory.initFileLogger(logPath);
                logger.info('SHAFT GUI Wallet started v' + version);

                logger.debug("Checking for local binaries");
                gethNodeService.init(paths).then(success => {
                    logger.debug('Successful start:', success);
                    resolve()
                }, err => {
                    logger.error('BAD', err);
                    reject(err);
                });
            },
            rej => reject(rej));
    })
}

module.exports = {
    init: init
};
