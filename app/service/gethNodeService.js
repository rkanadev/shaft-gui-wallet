'use strict';

const LoggerFactory = require('../util/logger');
const logger = LoggerFactory.getLogger('GethNodeService');
const web3Service = require('./web3service');
const pathsService = require('./paths-service');
const fs = require('fs');
const crypto = require('crypto');
const makeDir = require('make-dir');
const appConfig = require('../config/appConfig.json');
const request = require('request');
const buildsConfig = require('../config/builds.json');
const spawn = require("child_process").spawn;
const platform = process.platform;
const dirEnum = {'SHAFT_GUI': 'shaft_gui', 'BINARIES': 'binaries'};


/**
 *
 * @param path path to file
 */
function checkBinaryExist(path) {
    return fs.existsSync(path)

}


function downloadBinary(url, destPath) {
    return new Promise((resolve, reject) => {
        logger.info('Downloading geth binary from ' + url);

        let file = fs.createWriteStream(destPath);
        let sendReq = request.get(url);

        // verify response code
        sendReq.on('response', function (response) {
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
            resolve();
        });


        file.on('error', function (err) { // Handle errors
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            reject('Could not download binary file: ' + err.message);
        });
    });
}

/**
 * Trying to check if IPC file is exists, if not, then start our own node.
 * Resolves if IPC file found or node successfully started. Reject on errors
 * @returns {Promise}
 */
function startNode(ipcPath, execPath, sha256, nodeLogFile) {
    return new Promise((resolve, reject) => {
        let isIPCFileExists = fs.existsSync(ipcPath);
        logger.silly('Checking IPC file in' + ipcPath);
        if (isIPCFileExists) {
            web3Service.init(ipcPath);
            resolve();
        } else {
            logger.info('IPC file not found, starting node')
            let proc = null;
            let args = [];

            if (appConfig.testnet) {
                logger.info('Starting in network: testnet')
                args.push('--testnet')
            } else {
                logger.info('Starting in network: mainnet')
            }
            if (appConfig.rpc) {
                logger.info('With RPC enabled.')
                args.push('--rpc')
            }
            //Check sha
            checkHashsumOfFile(execPath, sha256).then(() => {
                proc = spawn(execPath, args);
                logger.debug('Checksum is valid, starting node')
                // node has a problem starting
                proc.once('error', (err) => {
                    logger.error('Node startup error:' + err);
                    reject(error);
                });

                // we need to read the buff to prevent node from not working
                proc.stderr.pipe(
                    fs.createWriteStream(nodeLogFile, {flags: 'a'})
                );

                // when proc outputs data
                proc.stdout.on('data', (data) => {
                    logger.silly(data);
                });

                // when proc outputs data in stderr
                proc.stderr.on('data', (data) => {
                    if (data.indexOf("IPC endpoint opened") !== -1) {
                        //setTimeout(function () {
                            logger.debug("Connecting web3 to gethNode");
                            web3Service.init(ipcPath);
                        //}, 3000);
                    }
                    logger.silly(data);
                });
                resolve()
            }, err => {
                reject(err);
            })
        }

    });
}

function checkHashsumOfFile(path, sha256) {
    return new Promise((resolve, reject) => {
        let algo = 'sha256';
        let shasum = crypto.createHash(algo);
        let execPath = path;
        let s = fs.ReadStream(execPath);
        s.on('data', function (d) {
            shasum.update(d);
        });
        s.on('end', function () {
            let d = shasum.digest('hex');
            if (d !== sha256) {
                reject('SHA256 hashsum test failed. Please, remove incorrect binary from ~/.shaft-gui/binaries');
            } else {
                resolve();
            }
        });
    })
}

function onNodeStarted(resolve) {
    logger.info("Started embedded geth node");
    resolve();
}

function onNodeStartError(err, reject) {
    logger.error("Could not start node: " + err);
    reject(err);
}

function getIpcPath(testnet) {
    let ipcPath = pathsService.getShaftDir();
    if(isPlatformWindows()) {
        //todo move logic to pathService
        ipcPath = '\\\\.\\pipe\\';
        ipcPath += '\\geth.ipc';
        //for some reason windows geth always create file in \\.\pipe\geth.ipc
        return ipcPath;
    }
    if (testnet) {
        if (isPlatformLinux()) {
            ipcPath +=  '/testnet' + '/geth.ipc';
        }
        return ipcPath;
    } else {
        if (isPlatformLinux()) {
            ipcPath += '/geth.ipc'
        }
        return ipcPath;
    }
}

function init() {
    return new Promise((resolve, reject) => {
        logger.info('Geth node service started up');
        if (!isPlatformWindows() && !isPlatformLinux()) {
            reject('Sorry, platform ' + platform + ' is unsupported')
        }
        let execPath = pathsService.getExecutablePath();
        let isBinaryExist = checkBinaryExist(execPath);
        let buildUrl = pathsService.getCurrentBuildUrl();
        let sha256 = pathsService.getCurrentBuildSHA256();
        let nodeLogFile = pathsService.getNodeLogPath();
        if (isBinaryExist) {
            //TODO remove code duplication
            let ipcPath = getIpcPath(appConfig.testnet);
            startNode(ipcPath, execPath, sha256, nodeLogFile).then(() => onNodeStarted(resolve), err => onNodeStartError(err, reject))
        } else {
            downloadBinary(buildUrl, execPath).then(() => {
                    if (isPlatformLinux()) {
                        fs.chmodSync(execPath, '0755');
                    }
                    logger.info("Successfully downloaded build from" + buildUrl + " and placed it into "
                        + execPath);
                    let ipcPath = getIpcPath(appConfig.testnet);
                    startNode(ipcPath, execPath, sha256, nodeLogFile).then(() => onNodeStarted(resolve), err => onNodeStartError(err, reject));
                }, (error) => {
                    reject(error);
                }
            );
        }

    })
}

function isPlatformLinux() {
    return platform.indexOf("linux") !== -1
}

function isPlatformWindows() {
    return platform.indexOf("win") !== -1
}

function checkOrCreateFolders() {
    return new Promise((resolve, reject) => {
        let guiDir = pathsService.getShaftGuiDir();
        let binariesDir = pathsService.getBinariesDir();
        let isGUIdirExist = fs.existsSync(guiDir);
        let isBinariesDirExists = fs.existsSync(binariesDir);
        if (!isGUIdirExist || !isBinariesDirExists) {
            makeDir(binariesDir).then(() => {
                logger.debug("Successfully created " + binariesDir + " folder.")
                resolve()
            }, err => {
                logger.error(err);
                reject(err)
            })
        } else {
            resolve();
        }
    });
}

module.exports = {
    checkOrCreateFolders: checkOrCreateFolders,
    init: init
};