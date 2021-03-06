import { Injectable } from '@angular/core';
import {AbstractIPCService} from "../abstract/abstract-ipc.service";

@Injectable()
export class IPCService extends AbstractIPCService {

  constructor() {
    super();
  }

  public sendExitApp() {
    return new Promise((resolve, reject) => {
      this.request('app_exit').subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        resolve(result);
      }, err => {
        reject(err)
      });

    });
  }


  public minimizeApp() {
    return new Promise((resolve, reject) => {
      this.request('app_minimize').subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        resolve(result);
      }, err => {
        reject(err)
      });

    });
  }

  public maximizeApp() {
    return new Promise((resolve, reject) => {
      this.request('app_maximize').subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        resolve(result);
      }, err => {
        reject(err)
      });

    });
  }

  public unmaximizeApp() {
    return new Promise((resolve, reject) => {
      this.request('app_unmaximize').subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        resolve(result);
      }, err => {
        reject(err)
      });

    });
  }


  private errCallBack(err) {
    console.log('Could not read response from IPC layer', err);
  }

  public isSyncing() {
    return new Promise((resolve, reject) => {
      this.request('is_syncing').subscribe(result => {
        let res = result.result;
        resolve(res);
      }, err => reject(err))
    });


  }

  public getPeerCount() {
    return new Promise((resolve, reject) => {
      this.request('peer_count').subscribe(result => {
        let res = result.result;
        resolve(res);
      }, err => reject(err))
    });

  }

  public getBlockCount() {
    return new Promise((resolve, reject) => {
      this.request('block_number').subscribe(result => {
        let res = result.result;
        resolve(res);
      }, err => reject(err))
    });
  }

  public getAccounts(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request('get_accounts').subscribe(result => {
        let res = result.result;
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public getBalance(address: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request('get_balance', address).subscribe(result => {
        let res = result.result;
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public newAccount(password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request('new_account', password).subscribe(result => {
        let res = result.result;
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public sendTransaction(transactionData: object) {
    return new Promise((resolve, reject) => {
      this.request('send_transaction', transactionData).subscribe(result => {
        let res = result.result;
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public lockAccount(address: string) {
    return new Promise((resolve, reject) => {
      this.request('lock_account', address).subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        let res = result.result;
        if (result == null) {
          reject('Lock account returned null, possibly invalid account address given');
        }
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public unlockAccount(address: string, password: string) {
    return new Promise((resolve, reject) => {
      this.request('unlock_account', {account: address, password: password}).subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        let res = result.result;
        if (result == null) {
          reject('Unlock account returned null, possibly invalid account address given');
        }
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public getTransactionsByAddress(address: string) {
    return new Promise((resolve, reject) => {
      this.request('get_transactions_by_address', address).subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        let res = result.result;
        if (result == null) {
          reject('Get transactions by address returned null');
        }
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public getTransactionByHash(txHash: string) {
    return new Promise((resolve, reject) => {
      this.request('get_transaction_by_hash', txHash).subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        let res = result.result;
        if (result == null) {
          reject(`Get transactions by hash ${txHash} returned null`);
        }
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public saveAddressLabel(address: string, label: string) {
    return new Promise((resolve, reject) => {
      this.request('save_address_label', {address: address, label: label}).subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        let res = result.result;
        if (result == null) {
          reject('Save address label returned null');
        }
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public getAddressLabel(address: string) {
    return new Promise((resolve, reject) => {
      this.request('get_address_label', {address: address}).subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        let res = result.result;
        if (result == null) {
          reject('Get address label returned null');
        }
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public getMinedBlocks() {
    return new Promise((resolve, reject) => {
      this.request('get_mined_blocks').subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        let res = result.result;
        if (result == null) {
          reject('Get mined blocks returned null');
        }
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public getDifficulty() {
    return new Promise((resolve, reject) => {
      this.request('get_difficulty').subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        let res = result.result;
        if (result == null) {
          reject('Get difficulty returned null');
        }
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }


  public isInitialized() {
    return new Promise((resolve, reject) => {
      this.request('is_initialized').subscribe(result => {
        if (result.error) {
          reject(result.error)
        }
        let res = result.result;
        if (result == null) {
          reject('Get difficulty returned null');
        }
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

}
