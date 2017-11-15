import {Injectable} from '@angular/core';
import {AbstractIPCService} from "../abstract/abstract-ipc.service";

@Injectable()
export class ElectronIPCService extends AbstractIPCService {

  constructor() {
    super();
  }

  public sendExitApp() {
    return new Promise((resolve, reject) => {
      this.request('app_exit').subscribe(result => {
        resolve(result);
      }, err => {
        reject(err)
      });

    });
  }


  public minimizeApp() {
    return new Promise((resolve, reject) => {
      this.request('app_minimize').subscribe(result => {
        resolve(result);
      }, err => {
        reject(err)
      });

    });
  }

   public maximizeApp() {
    return new Promise((resolve, reject) => {
      this.request('app_maximize').subscribe(result => {
        resolve(result);
      }, err => {
        reject(err)
      });

    });
  }


}
