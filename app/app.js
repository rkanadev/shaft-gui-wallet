'use strict';
const fs = require('fs');
const request = require('request');
const logger = require('./util/logger').getLogger('App.js');
const homeDir = process.env.HOME;
const shaftDir = '/.shaft-gui';
const binariesDir = '/binaries';
const builds = require('./config/builds.json');
const spawn = require('child_process').spawn;
const ipc_api = require('./ipc/ipc_api');
const web3service = require('./service/web3service');
const appConfig = require('./config/appConfig.json');

function init() {
    logger.info('SHAFT GUI Wallet started v0.01');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
    logger.debug("Checking for local binaries");

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
                downloadBinary();
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
                downloadBinary();
            })
        }
    }


}

function initNode() {
    logger.info('Module node initializing started');

    let IsIPCFileExists = fs.existsSync(appConfig.testnet ? homeDir + '/.shaft/testnet/geth.ipc' : '/.shaft/geth.ipc');

    if (IsIPCFileExists) {
        logger.debug('IPC file found. Probably we already have running node in the system');
    } else {
        logger.debug('IPC file does not exists, trying to start our own node');
        let proc = null;
        if(appConfig.testnet) {
            proc = spawn(homeDir + shaftDir + binariesDir + '/geth_linux', ['--testnet']);
        }else {
            proc = spawn(homeDir + shaftDir + binariesDir + '/geth_linux');
        }

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
            logger.silly('Got stdout data from node');
        });

        // when proc outputs data in stderr
        proc.stderr.on('data', (data) => {
            logger.silly('Got stderr data from node ' + data);
        });


    }

}

function downloadBinary() {
    logger.info('Downloading geth binary from ' + builds.geth.linux.x86_64.latest);

    let dest = homeDir + shaftDir + binariesDir + '/geth_linux';
    let file = fs.createWriteStream(dest);
    let sendReq = request.get(builds.geth.linux.x86_64.latest);

    // verify response code
    sendReq.on('response', function (response) {
        console.log(response.statusCode);
        if (response.statusCode !== 200) {
            logger.error('Could not download binary file from github, response status: ' + response.statusCode);
            return new Error('Could not download binary file from github, response status: ' + response.statusCode);
        }
    });

    // check for request errors
    sendReq.on('error', function (err) {
        fs.unlink(dest);
        throw new Error('Could not download binary file: ' + err.message);
    });

    sendReq.pipe(file);

    file.on('finish', function () {
        logger.info('Successfully downloaded geth binary');
        file.close();  // close() is async, call cb after close completes.
        fs.chmodSync(homeDir + shaftDir + binariesDir + '/geth_linux', '0755');
    });


    file.on('error', function (err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        throw new Error('Could not download binary file: ' + err.message);
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
