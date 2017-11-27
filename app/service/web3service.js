'use strict';

const Web3 = require('web3');
const net = require('net');
const logger = require('../util/logger').getLogger('Web3Service');

let web3 = null;


function init(path) {
    try {
        logger.info("Connecting to Web3 IPC on path " + path);
        web3 = new Web3(new Web3.providers.IpcProvider(path, net));
    }
    catch (e) {
        logger.error("Could not connect to Web3 IPC node on path" + path + " Error:" + e, " Code:" + e.code);
    }
}

function getWeb3() {
    if (!web3) {
        logger.warn('IPC connection is not yet initiated');
        return null;
    }
    return web3;
}

function haltWeb3() {
    web3 = null;
}

module.exports = {
    init: init,
    haltWeb3: haltWeb3,
    getWeb3: getWeb3
};