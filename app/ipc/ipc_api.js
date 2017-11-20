'use strict';
const electron = require('electron');
const ipcMain = require('electron').ipcMain;
const logger = require('../util/logger').getLogger('IPC_Api');
const web3service = require('../service/web3service');
const configService = require('../service/config-service');
const BigNumber = require('bignumber.js');
const fetch = require('node-fetch');
const app = require('electron').app;
const window = require('../util/window');
const _ = require('underscore');

electron.ipcMain.on('web3-req-channel', (event, arg) => {
    //console.log('IPC: Request from client', event, arg);
    logger.silly('Message from web3-req-channel:' + JSON.stringify(arg));
    let result = requestDecoder(arg.data).then((result) => {
        let resultBody = {id: arg.id, result: result};
        logger.silly('Message to web3-res-channel:' + JSON.stringify(resultBody));
        event.sender.send('web3-res-channel', resultBody);
    }, (error) => {
        logger.error('Unable to process process request: ' + error);
        let resultError = error;
        if (error.message) {
            resultError = error.message;
            if (error.stack) {
                logger.silly(error.stack);
            }
        }
        let resultBody = {id: arg.id, result: null, error: resultError};
        event.sender.send('web3-res-channel', resultBody);
    });
});

function isSyncing() {
    return new Promise((resolve, reject) => {
        let web3 = web3service.getWeb3();

        if (!web3) {
            resolve(false);
        }

        web3.eth.getSyncing(function (err, sync) {
            //todo see web3api isSyncing and rethink that
            if (err) {
                reject(err);
            } else {
                //syncObject = {currentBlock:0,highestBlock:0,knownStates:0,pulledStates:0,startingBlock:0}
                if (typeof sync === 'boolean') {
                    //node is not syncing, boolean
                    if (sync) {
                        resolve('Syncing');
                    } else {
                        resolve('Not syncing');
                    }
                } else if (typeof sync === 'object') {
                    //node is syncing, obj, see web3api
                    resolve(`Syncing: ${sync.currentBlock}/${sync.highestBlock}`);
                } else {
                    reject('Unknown type of sync ' + typeof sync, +" " + sync);
                }
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

function lockAccount(account) {
    return new Promise((resolve, reject) => {
        let web3 = web3service.getWeb3();

        if (!web3) {
            reject('Web3 is null');
        }

        web3.personal.lockAccount(account, function (err, lockAccount) {
            if (err) {
                reject(err);
            } else {
                return resolve(lockAccount);
            }
        });
    });

}

function unlockAccount(unlockData) {
    return new Promise((resolve, reject) => {
        let web3 = web3service.getWeb3();

        if (!web3) {
            reject('Web3 is null');
        }
        if (!unlockData || (!unlockData.account || !unlockData.password)) {
            reject('Invalid params')
        }

        web3.personal.unlockAccount(unlockData.account, unlockData.password, function (err, lockAccount) {
            if (err) {
                reject(err);
            } else {
                return resolve(lockAccount);
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
                resolve(accounts);
            }
        });
    });
}

function getTransactionByAddress(address) {
    return new Promise((resolve, reject) => {
        fetch('https://testnet.explorer.shaft.sh/api/address/' + address)
            .then(res => res.json())
            .then(json => {
                    let transactions = json.transactions;
                    resolve(transactions);
                }
            )
            .catch(err => {
                reject(err)
            });
    })
}

function getTransactionByHash(address) {
    return new Promise((resolve, reject) => {
        let web3 = web3service.getWeb3();

        if (!web3) {
            reject('No web3')
        }
        web3.eth.getTransaction(address, function (err, transaction) {
            if (err) {
                reject(err);
            } else {
                transaction.value = transaction.value.toString(10);
                transaction.gasPrice = transaction.gasPrice.toString(10);
                resolve(transaction);
            }
        });
    })
}

function getBalance(address) {
    return new Promise((resolve, reject) => {
        let web3 = web3service.getWeb3();

        if (!web3) {
            reject()
        }
        web3.eth.getBalance(address, function (err, balance) {
            if (err) {
                reject(err);
            } else {
                let result = balance.toString(10);
                resolve(result);
            }
        });
    });
}

function sendTransaction(transactionData) {
    return new Promise((resolve, reject) => {
        let web3 = web3service.getWeb3();

        if (!web3) {
            reject('web3 is null')
        }

        //todo validate
        web3.eth.sendTransaction(transactionData, function (err, receipt) {
            if (err) {
                reject(err);
            } else {
                resolve(receipt);
            }
        });
    });
}

function newAccount(password) {
    return new Promise((resolve, reject) => {
        let web3 = web3service.getWeb3();

        if (!web3) {
            reject('web3 is null')
        }

        web3.personal.newAccount(password, function (err, balance) {
            if (err) {
                reject(err);
            } else {
                let result = balance.toString(10);
                resolve(result);
            }
        });
    });
}

function saveAddressLabel(address, label) {
    return new Promise((resolve, reject) => {
        configService.saveAddressLabel(address, label).then(() => {
            resolve();
        }, error => {
            reject(error)
        })
    });
}

function getAddressLabel(address,) {
    return new Promise((resolve, reject) => {
        configService.getAddressLabel(address).then((label) => resolve(label), (err) => {
            reject(err)
        })
    })
}

function exitApp() {
    return new Promise((resolve, reject) => {
        //todo promisify exit
        setTimeout(function () {
            app.exit();
        }, 3000);
        resolve()
    })
}

function minimizeApp() {
    return new Promise((resolve, reject) => {
        //todo promisify minimize
        window.minimize();
        resolve();
    })
}

function maximizeApp() {
    return new Promise((resolve, reject) => {
        //todo promisify maximize
        window.maximize();
        resolve()
    })
}

function getMinedBlocks() {
    return new Promise((resolve, reject) => {
        let web3 = web3service.getWeb3();

        if (!web3) {
            reject('web3 is null')
        }


        web3.eth.getAccounts(function (err, accounts) {
                if (err) {
                    reject(err);
                } else {
                    let promises = [];
                    let minedBlocks = [];
                    accounts.forEach((account) => {
                        promises.push(new Promise((resolvee, rejectt) => {
                            fetch('https://testnet.explorer.shaft.sh/api/address/' + account + '/mined')
                                .then(res => res.json())
                                .then(json => {
                                        minedBlocks.push(json)
                                        resolvee();
                                    }
                                )
                                .catch(err => {
                                    rejectt(err)
                                })

                        }));

                    });

                    Promise.all(promises).then((result) => {
                        let flattened = _.flatten(minedBlocks);
                        resolve(flattened);
                    }, err => {
                        reject(err)
                    })

                }
            }
        )
    });
}


function unmaximizeApp() {
    return new Promise((resolve, reject) => {
        //todo promisify unmaximize
        window.unmaximize();
        resolve()
    })
}


function requestDecoder(data) {
    return new Promise((resolve, reject) => {
        //todo validate data.params
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
            case 'get_balance':
                if (!data.params) {
                    reject('No params')
                }
                getBalance(data.params).then((result) => {
                    resolve(result);
                }, rej => reject(rej));
                break;
            case 'new_account':
                if (!data.params) {
                    reject('No params')
                }
                newAccount(data.params).then((result) => {
                    resolve(result);
                }, rej => reject(rej));
                break;
            case 'send_transaction':
                if (!data.params && (!data.params.from && !data.params.to && !data.params.from)) {
                    reject('No params')
                }
                sendTransaction(data.params).then((result) => {
                    resolve(result);
                }, rej => reject(rej));
                break;
            case 'lock_account':
                if (!data.params) {
                    reject('No params')
                }
                lockAccount(data.params).then((result) => {
                    resolve(result);
                }, rej => reject(rej));
                break;
            case 'unlock_account':
                if (!data.params) {
                    reject('No params')
                }
                unlockAccount(data.params).then((result) => {
                    resolve(result);
                }, rej => reject(rej));
                break;
            case 'get_transactions_by_address':
                if (!data.params) {
                    reject('No params')
                }
                getTransactionByAddress(data.params).then((result) => {
                    resolve(result);
                }, rej => reject(rej));
                break;
            case 'get_transaction_by_hash':
                if (!data.params) {
                    reject('No params')
                }
                getTransactionByHash(data.params).then((result) => {
                    resolve(result);
                }, rej => reject(rej));
                break;
            case 'save_address_label':
                if (!data.params && (!data.params.address || !data.params.label)) {
                    reject('No params')
                }
                saveAddressLabel(data.params.address, data.params.label).then((result) => {
                    resolve(result);
                }, rej =>
                    reject(rej));
                break;
            case 'get_address_label':
                if (!data.params && (!data.params.address)) {
                    reject('No params')
                }
                getAddressLabel(data.params.address).then((result) => {
                    resolve(result);
                }, rej => reject(rej));
                break;
            case 'app_exit':
                exitApp().then((result) => {
                    resolve(result);
                }, err => reject(err));
                break;
            case 'app_minimize':
                minimizeApp().then((result) => {
                    resolve(result);
                }, err => reject(err));
                break;
            case 'app_maximize':
                maximizeApp().then((result) => {
                    resolve(result);
                }, err => reject(err));
                break;
            case 'app_unmaximize':
                unmaximizeApp().then((result) => {
                    resolve(result);
                }, err => reject(err));
                break;
            case 'get_mined_blocks':
                getMinedBlocks().then((result) => {
                    resolve(result);
                }, err => reject(err));
                break;
            default:
                logger.error('Could not find suitable method for this request');
                reject('Could not find suitable method for this request');
        }
    });

}

module.exports = {
    getAccounts: getAccounts
};