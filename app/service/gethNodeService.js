'use strict';

const LoggerFactory = require('../util/logger');
const logger = LoggerFactory.getLogger('GethNodeService');
const web3Service = require('./web3service');
const pathsService = require('./paths-service');
const fs = require('fs');
const crypto = require('crypto');
const makeDir = require('make-dir');
const configService = require('../service/config-service');
const request = require('request');
const buildsConfig = require('../config/builds.json');
const spawn = require("child_process").spawn;
const platform = process.platform;
const dirEnum = {'SHAFT_GUI': 'shaft_gui', 'BINARIES': 'binaries'};
const ipcApi = require('../ipc/ipc_api');
const procHolder = require('../util/procHolder');

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
            logger.info("Connecting using existing file in " + ipcPath);
            web3Service.init(ipcPath);
            ipcApi.init(null);
            resolve(null);
        } else {
            logger.info('IPC file not found, starting node');
            let proc = null;
            let args = [];

            let config = configService.getConfig();

            let bootnodes = [];
            if (config.testnet) {
                logger.info('Starting in network: testnet');
                //Bootnodes
                bootnodes.push('enode://8401883922960f919b663b2109029cfc3be5cac68a2a6386fdfd404c834fa517c4ca970e8d9463a4b632cfb2031e661cf6630b87f23fff2ee0de86a526a3845f@137.74.162.146:30308');

                //Regular nodes
                bootnodes.push('enode://5618ab2920ed59e0312b7c70af7f8c1a83db5990e0c1df0a3ac3d8c326f640b3038f24da2d1264fca70dd5faa9c41e38c3fa28fd9553aa8284310be05853a1d7@137.74.162.146:30304');

                args.push('--bootnodes=' + bootnodes.join());
                args.push('--testnet')
            } else {
                //Bootnodes
                bootnodes.push("enode://42e80282656545c01ab78e47dfa0d664ad5d7468643e81a05b8d17d4c269a9fbf30ffd23cfa065a4599ffa16b7700ed0a0c075c0a027641f9c7e1f765dcad659@158.69.209.240:30307");
                bootnodes.push("enode://d4681c54ae0055591f4cf473e85e60ad47c564c7760d2fed7fc25ada06cdb4a845d8f0768e640a0e790cca3e1beb924ec3b4a4e51deb9d169c271bf1b2632f0b@149.56.99.203:30307");
                bootnodes.push("enode://155db7f85443ae6b8f68e1dae7c2c89a2dd537239732bf0400ba18324fcc0ee866b2066cbb8b4a1994c13c83cb4e78197041822030a05b257e0144f7f1c61354@137.74.162.146:30307");
                bootnodes.push("enode://8401883922960f919b663b2109029cfc3be5cac68a2a6386fdfd404c834fa517c4ca970e8d9463a4b632cfb2031e661cf6630b87f23fff2ee0de86a526a3845f@94.130.105.46:30307");
                bootnodes.push("enode://fe4a3fe3822c25052502481954e4ba2088e9662e6059af235e2d7f67ce90a9f30b6dc5478ca2d82fe7e98cc806276c62bf88cd8213bd13c2d1f0199784d6b1b4@94.130.111.226:30307");

                //Regular nodes
                bootnodes.push("enode://9b35465e4dc22b143cc9d32bc506d0773c68c2f3f79a4473b5eefd0629288cdf3d0d2ea188accbe9775e35ff058478ad09e520a77f7aca06a7c32385fcde173c@158.69.209.240:30303");
                bootnodes.push("enode://8ce4f7b3d566ed61d8a97ffd4f5e6749bd0f6371ce97729178fb66cc861648028842103439e9e003bdbd21307b0167298aac3f055f6b4eab981e02f26eac51b7@137.74.162.146:30303");
                bootnodes.push("enode://a6b2c7a2e8c72034d767e749818a8d85c9e693a75138ddb59e005501cd2ccf3688fa8ed50daa2cd8de927fd9dd760f191072032a1f629a4eae528acf1f1c2d25@94.130.105.46:30303");
                bootnodes.push("enode://f001337f64ef88bc595e5304713fa9148407cee2062ba1de58c5200eda3206d7a9dd715ebe5844fc724d3a31909bcc4bbfbfefe7c6f9536ed969c3362b22939a@94.130.111.226:30303");

                args.push('--bootnodes=' + bootnodes.join());
                logger.info('Starting in network: mainnet');
            }
            if (config.rpc) {
                logger.info('With RPC enabled.');
                args.push('--rpc')
            }
            //Check sha
            checkHashsumOfFile(execPath, sha256).then(() => {
                proc = spawn(execPath, args);
                logger.debug('Checksum is valid, starting node');
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
                    logger.info(data);
                });

                // when proc outputs data in stderr
                proc.stderr.on('data', (data) => {
                    if (data.indexOf("IPC endpoint opened") !== -1) {
                        logger.debug("Connecting web3 to gethNode");
                        web3Service.init(ipcPath);
                    }
                    logger.info(data);
                });
                ipcApi.init(proc);
                procHolder.putProc(proc)
                resolve(proc)
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
                //todo fix path in message
                reject('SHA256 hashsum test failed. Please, remove incorrect binary from ~/.shaft-gui/binaries');
            } else {
                resolve();
            }
        });
    })
}

function onNodeStarted(resolve, proc) {
    if (proc) {
        logger.info("Started embedded geth node");
    } else {
        logger.info("Connecting to node on existing IPC connection");
    }
    resolve();
}

function onNodeStartError(err, reject) {
    logger.error("Could not start node: " + err);
    reject(err);
}

function getIpcPath(testnet) {
    let ipcPath = pathsService.getShaftDir();
    if (isPlatformWindows()) {
        //todo move logic to pathService
        ipcPath = '\\\\.\\pipe\\';
        ipcPath += '\\geth.ipc';
        //for some reason windows geth always create file in \\.\pipe\geth.ipc
        return ipcPath;
    }
    if (testnet) {
        if (isPlatformLinux()) {
            ipcPath += '/testnet' + '/geth.ipc';
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
        logger.info('Geth node service starting up');
        let appConfig = configService.getConfig();
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
            startNode(ipcPath, execPath, sha256, nodeLogFile).then((proc) => onNodeStarted(resolve, proc), err => onNodeStartError(err, reject))
        } else {
            downloadBinary(buildUrl, execPath).then(() => {
                    if (isPlatformLinux()) {
                        fs.chmodSync(execPath, '0755');
                    }
                    logger.info("Successfully downloaded build from" + buildUrl + " and placed it into "
                        + execPath);
                    let ipcPath = getIpcPath(appConfig.testnet);
                    startNode(ipcPath, execPath, sha256, nodeLogFile).then((proc) => onNodeStarted(resolve, proc), err => onNodeStartError(err, reject));
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
                logger.debug("Successfully created " + binariesDir + " folder.");
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