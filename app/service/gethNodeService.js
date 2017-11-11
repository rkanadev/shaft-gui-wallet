'use strict';

const LoggerFactory = require('../util/logger');
const logger = LoggerFactory.getLogger('GethNodeService');
const web3Service = require('./web3service');
const fs = require('fs');
const crypto = require('crypto');
const makeDir = require('make-dir');
const appConfig = require('../config/appConfig.json');
const request = require('request');
const buildsConfig = require('../config/builds.json');
const spawn = require("child_process").spawn;
const platform = process.platform;
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
    logger.error("Could not start node: " + err)
    reject(err);
}

function getIpcPath(paths, testnet) {
    let ipcPath = paths.homeDir;
    if (testnet) {
        if (isPlatformLinux()) {
            ipcPath +=  paths.shaftDir + '/testnet' + '/geth.ipc';
        }
        if (isPlatformWindows()) {
            ipcPath += paths.shaftDir + '\\testnet' + '\\geth.ipc';
        }
        return ipcPath;
    } else {
        if (isPlatformLinux()) {
            ipcPath += paths.shaftDir + '/geth.ipc'
        }
        if (isPlatformWindows()) {
            ipcPath += paths.shaftDir + '\\geth.ipc'
        }
        return ipcPath;
    }
}

function init(paths) {
    return new Promise((resolve, reject) => {
        logger.info('Geth node service started up');
        if (!isPlatformWindows() && !isPlatformLinux()) {
            reject('Sorry, platform ' + platform + ' is unsupported')
        }
        let isBinaryExist = checkBinaryExist(paths.homeDir + paths.shaftGUIDir + paths.binariesDir + paths.executablePath);
        let execPath = paths.homeDir + paths.shaftGUIDir + paths.binariesDir + paths.executablePath;
        let sha256 = paths.sha256;
        let nodeLogFile = paths.homeDir + paths.shaftGUIDir + paths.nodeLogFile;
        if (isBinaryExist) {
            //TODO remove code duplication
            let ipcPath = getIpcPath(paths, appConfig.testnet);
            startNode(ipcPath, execPath, sha256, nodeLogFile).then(() => onNodeStarted(resolve), err => onNodeStartError(err, reject))
        } else {
            downloadBinary(paths.buildUrl, execPath).then(() => {
                    if (isPlatformLinux()) {
                        fs.chmodSync(execPath, '0755');
                    }
                    logger.info("Successfully downloaded build from" + paths.buildUrl + " and placed it into "
                        + execPath);
                    let ipcPath = getIpcPath(paths, appConfig.testnet);
                    startNode(ipcPath, execPath, sha256, nodeLogFile).then(() => onNodeStarted(resolve), err => onNodeStartError(err, reject));
                }, (error) => {
                    reject(error);
                }
            );
        }
        /*
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
        })*/
    })
}

function initPaths() {
    let homeDir = null;
    let shaftGUIDir = null;
    let binariesDir = null;
    let executablePath = null;
    let buildUrl = null;
    let platform = null;
    let fileName = null;
    let shaftDir = null;
    let sha256 = null;
    let logfile = null;
    let nodeLogFile = null;
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
        nodeLogFile = '/node.log'
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
        nodeLogFile = '\\node.log'
    }

    return {
        platform: platform,
        buildUrl: buildUrl,
        sha256: sha256,
        fileName: fileName,
        homeDir: homeDir,
        shaftDir: shaftDir,
        shaftGUIDir: shaftGUIDir,
        binariesDir: binariesDir,
        executablePath: executablePath,
        logfile: logfile,
        nodeLogFile: nodeLogFile
    }
}

function isPlatformLinux() {
    return platform.indexOf("linux") !== -1
}

function isPlatformWindows() {
    return platform.indexOf("win") !== -1
}

function checkOrCreateFolders(paths) {
    return new Promise((resolve, reject) => {
        let isGUIdirExist = fs.existsSync(paths.homeDir + paths.shaftGUIDir);
        let isBinariesDirExists = fs.existsSync(paths.homeDir + paths.shaftGUIDir + paths.binariesDir);
        let path = paths.homeDir + paths.shaftGUIDir + paths.binariesDir;
        if (!isGUIdirExist || !isBinariesDirExists) {
            makeDir(path).then(() => {
                logger.debug("Successfully created " + path + " folder.")
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
    initPaths: initPaths,
    init: init
};