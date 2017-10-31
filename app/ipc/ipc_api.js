'use strict';
const electron = require('electron');
const ipcMain = require('electron').ipcMain;
const logger = require('../util/logger').getLogger('IPC_Api');
const web3service = require('../service/web3service');

let api = {};


const IPCRequestsMap = {
    init: {
        request: "init_request",
        response: "init_response",
        description: "Init IPC layer. At now, just responses with actual map of request-response"
    },
    closeApp: {
        request: "close_app_request",
        response: "close_app_response",
        description: "Closing SHAFT-GUI"
    }
};

/*

electron.ipcMain.on(IPCRequestsMap.init.request, (event, arg) => {
    //console.log('IPC: Request from client', event, arg);
    event.sender.send(IPCRequestsMap.init.response, {map: IPCRequestsMap})
});
*/


electron.ipcMain.on('web3-req-channel', (event, arg) => {
    //console.log('IPC: Request from client', event, arg);
    logger.silly('Message from web3-req-channel:' + JSON.stringify(arg));
    let result = requestDecoder(arg.data).then((result) => {
        let resultBody = {id: arg.id, result: result};
        logger.silly('Message to web3-res-channel:' + JSON.stringify(resultBody));
        event.sender.send('web3-res-channel', resultBody);
    }, (error) => {
        logger.error('Unable to process process request', error);
        let resultBody = {id: arg.id, result: null, error: error};
        event.sender.send('web3-res-channel', resultBody);
    });
});

function isSyncing() {
    return new Promise((resolve)=> {
        let web3 = web3service.getWeb3();

        if (!web3) {
            resolve(false);
        }

        web3.eth.getSyncing(function (err, sync) {
            if (err) {
                if (!sync) {
                    //node is not syncing, boolean
                    resolve(sync);
                } else {
                    //node is syncing, obj, see web3api
                    resolve(true);
                }

            } else {
                resolve(sync);
            }
        });
    })

}

function getPeerCount() {
    return new Promise((resolve) => {
        let web3 = web3service.getWeb3();

        if (!web3) {
            resolve(0);
        }

        web3.net.getPeerCount(function (err, peers) {
            if (err) {
                resolve(0);
            } else {
                logger.silly('Peer count web3 responsed:' + peers);
                return resolve(peers);
            }
        });
    });

}

function getBlockNumber() {
    return new Promise((resolve) => {
        let web3 = web3service.getWeb3();

        if (!web3) {
            resolve(0);
        }

        web3.eth.getBlockNumber(function (err, blockNumber) {
            if (err) {
                resolve(0);
            } else {
                return resolve(blockNumber);
            }
        });
    });
}

function getAccounts() {
    return new Promise((resolve) => {
        let web3 = web3service.getWeb3();

        if (!web3) {
            resolve([])
        }

        web3.eth.getAccounts(function (err, accounts) {
            if (err) {
                resolve([]);
            } else {
                return resolve(accounts);
            }
        });
    });
}

function requestDecoder(data) {
    return new Promise((resolve, reject) => {
        switch (data.method) {
            case 'is_syncing':
                isSyncing().then((result) => {
                    resolve(result);
                });
                break;
            case 'peer_count':
                logger.silly('Request for peer count')
                getPeerCount().then((result) => {
                    resolve(result);
                });
                break;
            case 'block_number':
                getBlockNumber().then((result) => {
                    resolve(result);
                });
                break;
            case 'get_accounts':
                getAccounts().then((result) => {
                    resolve(result);
                });
                break;
            default:
                logger.error('Could not find suitable method for this request');
                reject('Could not find suitable method for this request');
        }
    });

}
