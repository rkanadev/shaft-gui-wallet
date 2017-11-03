import {Injectable, Pipe} from '@angular/core';
import {AbstractIPCService} from "../abstract/abstract-ipc.service";

@Injectable()
export class Web3IPCService extends AbstractIPCService {

  constructor() {
    super();

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

  public getBalance(address:string):Promise<any> {
    return new Promise((resolve, reject) => {
      this.request('get_balance', address).subscribe(result => {
        let res = result.result;
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }
  public newAccount(password:string):Promise<any> {
    return new Promise((resolve, reject) => {
      this.request('new_account', password).subscribe(result => {
        let res = result.result;
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public sendTransaction(transactionData:object) {
    return new Promise((resolve, reject) => {
      this.request('send_transaction', transactionData).subscribe(result => {
        let res = result.result;
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public lockAccount(address:string) {
    return new Promise((resolve, reject) => {
      this.request('lock_account', address).subscribe(result => {
        if(result.error) {
          reject(result.error)
        }
        let res = result.result;
        if(result == null){
          reject('Lock account returned null, possibly invalid account address given');
        }
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

  public unlockAccount(address:string, password:string) {
    return new Promise((resolve, reject) => {
      this.request('unlock_account', {account: address, password: password}).subscribe(result => {
        if(result.error) {
          reject(result.error)
        }
        let res = result.result;
        if(result == null){
          reject('Unlock account returned null, possibly invalid account address given');
        }
        resolve(res);
      }, err => {
        reject(err)
      });
    });
  }

}
