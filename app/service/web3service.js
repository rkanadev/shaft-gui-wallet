'use strict';

const Web3 = require('web3');
const net = require('net');

let web3 = null;

function init(path) {
    try {
        web3 = new Web3(new Web3.providers.IpcProvider(path, net));
    }
    catch (e) {
        console.log(e.code);
    }
}

function getWeb3() {
    if (!web3) {
        console.log('IPC connection is not yet initiated');
        return null;
    }
    return web3;
}

module.exports = {
    init: init,
    getWeb3: getWeb3
}