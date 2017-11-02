'use strict';

const LoggerFactory = require('../util/logger');
const logger = LoggerFactory.getLogger('GethNodeService');
const fs = require('fs');
const crypto = require('crypto');
const appConfig = require('../config/appConfig.json');
const request = require('request');
const buildsConfig = require('../config/builds.json');
const spawn = require("child_process").spawn;
const platform = process.platform;
let homeDir = null;
let shaftGUIDir = null;
let binariesDir = null;
let executablePath = null;
let buildUrl = null;
const dirEnum = {'SHAFT_GUI': 'shaft_gui', 'BINARIES': 'binaries'};

function createShaftGUIDir() {
    return new Promise((resolve, reject) => {
        let path = homeDir + shaftGUIDir;
        fs.mkdir(path, function (err) {
            if (err) {
                let message = 'Could not create Shaft GUI folder [' + path + '] : ' + err;
                logger.err(message);
                reject(message);
            } else {
                logger.silly('Created folder: ' + path);
                resolve();
            }
        })

    })
}

function createShaftBinariesDir() {
    return new Promise((resolve, reject) => {
        let path = homeDir + shaftGUIDir + binariesDir;
        fs.mkdir(path, function (err) {
            if (err) {
                let message = 'Could not create Shaft GUI binaries folder [' + homeDir + shaftGUIDir + '] : ' + err;
                logger.err(message);
                reject(message);
            } else {
                logger.silly('Created folder: ' + path);
                resolve();
            }
        })
    })
}

/**
 * Checks all required folders exists, return shaft_gui | binaries on reject.
 * @returns {Promise}
 */
function checkFolders() {
    return new Promise((resolve, reject) => {
        let shaftDirExists = fs.existsSync(homeDir + shaftGUIDir);
        if (!shaftDirExists) {
            reject(dirEnum.SHAFT_GUI);
        } else {
            let binariesDirExists = fs.existsSync(homeDir + shaftGUIDir + binariesDir);
            if (binariesDirExists) {
                resolve();
            } else {
                reject(dirEnum.BINARIES);
            }
        }
    })
}

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
            fs.chmodSync(homeDir + shaftGUIDir + binariesDir + '/geth_linux', '0755');
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
function startNode(ipcPath, execPath, sha256) {
    return new Promise((resolve, reject) => {
        let isIPCFileExists = fs.existsSync(ipcPath);
        logger.silly('Checking IPC file in' + ipcPath);
        if (isIPCFileExists) {
            resolve();
        } else {
            logger.info('IPC file not found, starting node')
            let proc = null;
            let args = [];

            if (appConfig.testnet) {
                args.push('--testnet')
            }
            if (appConfig.rpc) {
                args.push('--rpc')
            }
            //Check sha
            checkHashsumOfFile(execPath, sha256).then(() => {
                proc = spawn(execPath, args);

                // node has a problem starting
                proc.once('error', (err) => {
                    logger.error('Node startup error:' + err);
                    reject(error);
                });

                // we need to read the buff to prevent node from not working
                proc.stderr.pipe(
                    fs.createWriteStream(homeDir + shaftGUIDir + '/' + ('node.log'), {flags: 'a'})
                );

                // when proc outputs data
                proc.stdout.on('data', (data) => {
                    logger.silly(data);
                });

                // when proc outputs data in stderr
                proc.stderr.on('data', (data) => {
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
    logger.error("Could not start node: " + err)
    reject(err);
}

function init() {
    return new Promise((resolve, reject) => {
        logger.info('Geth node service started up');
        let platform = null;
        let fileName = null;
        let shaftDir = null;
        let sha256 = null;
        let logfile = null;
        if (process.arch !== 'x64') {
            reject('Sorry, unsupported architecture');
        }
        if (isPlatformLinux()) {
            platform = 'linux';
            buildUrl = buildsConfig.geth[platform].x64.latest.url;
            sha256 = buildsConfig.geth[platform].x64.latest.sha256
            fileName = buildUrl.substring(buildUrl.lastIndexOf("/")).substr(1);
            homeDir = process.env.HOME;
            shaftDir = '/.shaft';
            shaftGUIDir = '/.shaft-gui';
            binariesDir = '/binaries';
            executablePath = '/' + fileName;
            logfile = '/shaft-gui.log';
        }
        if (isPlatformWindows()) {
            platform = 'win';
            buildUrl = buildsConfig.geth[platform].x64.latest.url;
            sha256 = buildsConfig.geth[platform].x64.latest.sha256
            fileName = buildUrl.substring(buildUrl.lastIndexOf("/"));
            homeDir = process.env.APPDATA;
            shaftDir = '\\SHAFT';
            shaftGUIDir = '\\Shaft-GUI';
            binariesDir = '\\binaries';
            executablePath = '\\' + fileName;
            logfile = '\\shaft-gui.log';
        }
        if (!isPlatformWindows() && !isPlatformLinux()) {
            reject('Sorry, platform ' + platform + ' is unsupported')
        }
        LoggerFactory.initFileLogger(homeDir + shaftGUIDir + logfile);
        checkFolders().then(() => {
            if (appConfig.testnet) {
                startNode(homeDir + shaftDir + '/testnet' + '/geth.ipc', homeDir + shaftGUIDir + binariesDir + executablePath, sha256).then(() => onNodeStarted(resolve), err => onNodeStartError(err, reject))
            } else {
                startNode(homeDir + shaftDir + '/geth.ipc', homeDir + shaftGUIDir + binariesDir + executablePath, sha256).then(() => onNodeStarted(resolve), err => onNodeStartError(err, reject))
            }
        }, (err) => {
            if (err === dirEnum.SHAFT_GUI) {
                createShaftGUIDir().then(() => {
                    createShaftBinariesDir().then(() => {
                        //At this point folders are created, we now can check for binaries itself
                        let binaryExist = checkBinaryExist(homeDir + shaftGUIDir + binariesDir + executablePath);
                        if (binaryExist) {
                            if (appConfig.testnet) {
                                startNode(homeDir + shaftDir + '\\testnet' + '\\geth.ipc', homeDir + shaftGUIDir + binariesDir + executablePath, sha256).then(() => onNodeStarted(resolve), err => onNodeStartError(err, reject))
                            } else {
                                startNode(homeDir + shaftDir + '\\geth.ipc', homeDir + shaftGUIDir + binariesDir + executablePath, sha256).then(() => onNodeStarted(resolve), err => onNodeStartError(err, reject))
                            }
                        } else {
                            logger.info("Binaries not found, starting downloading");
                            downloadBinary(buildUrl, homeDir + shaftGUIDir + binariesDir + executablePath).then(() => {
                                    if (isPlatformLinux()) {
                                        fs.chmodSync(homeDir + shaftDir + binariesDir + executablePath, '0755');
                                    }
                                    logger.info("Successfully downloaded build from" + buildUrl + " and placed it into "
                                        + homeDir + shaftGUIDir + binariesDir + executablePath);
                                    if (appConfig.testnet) {
                                        startNode(homeDir + shaftDir + '/testnet' + '/geth.ipc', homeDir + shaftGUIDir + binariesDir + executablePath, sha256).then(() => onNodeStarted(resolve), err => onNodeStartError(err, reject))
                                    } else {
                                        startNode(homeDir + shaftDir + '/geth.ipc', homeDir + shaftGUIDir + binariesDir + executablePath, sha256).then(() => onNodeStarted(resolve), err => onNodeStartError(err, reject))
                                    }
                                }, (error) => {
                                    reject(error);
                                }
                            )
                        }
                    }, err => {
                        reject(err)
                    })
                }, err => {
                    reject(err);
                })
            } else if (err === dirEnum.BINARIES) {
                createShaftBinariesDir().then(() => {
                    //At this point folders are created, we now can check for binaries itself
                }, err => {
                    reject(err)
                })
            }
        })
    })
}

function initPaths() {
    let platform = null;
    let fileName = null;
    let shaftDir = null;
    let sha256 = null;
    let logfile = null;
    if (process.arch !== 'x64') {
        reject('Sorry, unsupported architecture');
    }
    if (isPlatformLinux()) {
        platform = 'linux';
        buildUrl = buildsConfig.geth[platform].x64.latest.url;
        sha256 = buildsConfig.geth[platform].x64.latest.sha256
        fileName = buildUrl.substring(buildUrl.lastIndexOf("/")).substr(1);
        homeDir = process.env.HOME;
        shaftDir = '/.shaft';
        shaftGUIDir = '/.shaft-gui';
        binariesDir = '/binaries';
        executablePath = '/' + fileName;
        logfile = '/shaft-gui.log';
    }
    if (isPlatformWindows()) {
        platform = 'win';
        buildUrl = buildsConfig.geth[platform].x64.latest.url;
        sha256 = buildsConfig.geth[platform].x64.latest.sha256
        fileName = buildUrl.substring(buildUrl.lastIndexOf("/"));
        homeDir = process.env.APPDATA;
        shaftDir = '\\SHAFT';
        shaftGUIDir = '\\Shaft-GUI';
        binariesDir = '\\binaries';
        executablePath = '\\' + fileName;
        logfile = '\\shaft-gui.log';
    }

    return {
        platform: platform,
        buildUrl: buildUrl,
        sha256: sha256,
        fileName: fileName,
        homeDir: homeDir,
        shaftDir: shaftDir,
    }
}

function isPlatformLinux() {
    return platform.indexOf("linux") !== -1
}

function isPlatformWindows() {
    return platform.indexOf("win") !== -1
}

module.exports = {
    init: init
}