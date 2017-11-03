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
                logger.info('SHAFT GUI Wallet started v0.0.1');

                logger.debug("Checking for local binaries");
                gethNodeService.init(paths).then(success => {
                    logger.debug('Successful start:', success)
                    resolve()
                }, err => {
                    logger.error('BAD', err);
                    reject(err);
                });
            },
            rej => reject(rej));

        // Open the DevTools.
        // mainWindow.webContents.openDevTools()

        /*

                if (!checkGUIDirCreated()) {
                    logger.debug('GUI folder is not exists');
                    logger.silly('Creating folder ' + homeDir + shaftDir);
                    fs.mkdir(homeDir + shaftDir, function (err) {
                        if (err) {
                            logger.error('Error while creating Shaft GUI folder %s', err);
                            throw new Error('Could not create Shaft GUI folder [' + homeDir + shaftDir + ']');
                        }
                        logger.silly('Successfully created Shaft GUI folder');

                        fs.mkdir(homeDir + shaftDir + binariesDir, function (err) {
                            if (err) {
                                throw new Error('Could not create Shaft geth binaries dir [' + homeDir + shaftDir + binariesDir + ']');
                            }
                            downloadBinary().then(() => {
                                logger.info("Successfully downloaded binaries");
                                //starting node
                                initNode();
                            }, error => {
                                logger.error(error);
                            });
                        })
                    });
                } else {
                    logger.silly('Shaft GUI folder dir exists');
                    if (checkBinariesDirCreated()) {
                        logger.silly('Binaries dir exists');
                        checkBinary();
                        initNode();
                        //Delaying startup
                        //Todo connect after ipc file creating
                        setTimeout(function () {
                            web3service.init(appConfig.testnet ? homeDir + '/.shaft/testnet/geth.ipc' : homeDir + '/.shaft/geth.ipc');
                        }, 5000)
                    } else {
                        logger.silly('Binaries dir does not exists, creating');
                        fs.mkdir(homeDir + shaftDir + binariesDir, function (err) {
                            if (err) {
                                throw new Error('Could not create Shaft geth binaries dir [' + homeDir + shaftDir + binariesDir + ']');
                            }
                            downloadBinary().then(() => {
                                logger.info('Binaries pulled from github, starting node')
                                initNode();
                            }, err => {
                                throw new Error(err)
                            });
                        })
                    }
                }
        */

    })

}

function initNode() {
    return new Promise((resolve, reject) => {
        logger.info('Node initializing started');
        let platform = process.platform;
        if (platform.indexOf("linux") === -1 || platform.indexOf("win") === -1) {
            logger.error("Sorry, unsupported platform: " + platform)
            reject("Sorry, unsupported platform: platform");
        }
        let ipcPath = appConfig.testnet ? homeDir + '/.shaft/testnet/geth.ipc' : '/.shaft/geth.ipc';
        let IsIPCFileExists = fs.existsSync(ipcPath);
        logger.silly('Checking IPC file in' + ipcPath);
        if (IsIPCFileExists) {
            logger.debug('IPC file found. Probably we already have running node in the system');
            resolve();
        } else {
            logger.debug('IPC file does not exists, trying to start our own node');
            let proc = null;
            let args = [];

            if (appConfig.testnet) {
                args.push('--testnet')
            }
            if (appConfig.rpc) {
                args.push('--rpc')
            }
            //Check sha
            let algo = 'sha256';
            let shasum = crypto.createHash(algo);
            let execPath = homeDir + shaftDir + binariesDir + '/geth_linux';
            let s = fs.ReadStream(execPath);
            s.on('data', function (d) {
                shasum.update(d);
            });
            s.on('end', function () {
                let d = shasum.digest('hex');
                if (d !== builds.geth.linux.x86_64.latest.sha256) {
                    throw new Error('SHA256 hashsum test failed. Please, remove incorrect binary from ~/.shaft-gui/binaries');
                }
            });

            proc = spawn(homeDir + shaftDir + binariesDir + '/geth_linux', args);

            // node has a problem starting
            proc.once('error', (err) => {
                logger.error('Node startup error', err);
            });

            // we need to read the buff to prevent node from not working
            proc.stderr.pipe(
                fs.createWriteStream(homeDir + shaftDir + '/' + ('node.log'), {flags: 'a'})
            );

            // when proc outputs data
            proc.stdout.on('data', (data) => {
                logger.silly('Got stdout data from node')
            });

            // when proc outputs data in stderr
            proc.stderr.on('data', (data) => {
                logger.silly('Got stderr data from node ' + data);
            });
            resolve()

        }
    });

}

function downloadBinary() {
    return new Promise((resolve, reject) => {
        logger.info('Downloading geth binary from ' + builds.geth.linux.x86_64.latest.url);

        let dest = homeDir + shaftDir + binariesDir + '/geth_linux';
        let file = fs.createWriteStream(dest);
        let sendReq = request.get(builds.geth.linux.x86_64.latest.url);

        // verify response code
        sendReq.on('response', function (response) {
            console.log(response.statusCode);
            if (response.statusCode !== 200) {
                logger.error('Could not download binary file from github, response status: ' + response.statusCode);
                reject('Could not download binary file from github, response status: ' + response.statusCode);
            }
        });

        // check for request errors
        sendReq.on('error', function (err) {
            fs.unlink(dest);
            reject('Could not download binary file: ' + err.message);
        });

        sendReq.pipe(file);

        file.on('finish', function () {
            logger.info('Successfully downloaded geth binary');
            file.close();  // close() is async, call cb after close completes.
            //TODO REMOVE THIS HARDCODE \/
            fs.chmodSync(homeDir + '/.shaft-gui' + binariesDir + '/geth_linux', '0755');
            resolve();
        });


        file.on('error', function (err) { // Handle errors
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            reject('Could not download binary file: ' + err.message);
        });
    });
}

function checkGUIDirCreated() {
    return fs.existsSync(homeDir + shaftDir);
}

function checkBinariesDirCreated() {
    return fs.existsSync(homeDir + shaftDir + binariesDir);
}

/**
 * Also downloads binaries
 * @returns {boolean}
 */
function checkBinary() {
    //TODO verify hash
    let exists = fs.existsSync(homeDir + shaftDir + binariesDir + '/geth_linux');

    logger.silly('Checked binary file existence, result: ' + exists);
    if (!exists) {
        downloadBinary();
    }
}

module.exports = {
    init: init
};
