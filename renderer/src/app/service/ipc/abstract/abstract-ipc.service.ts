import {Injectable, OnInit} from '@angular/core';
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

declare var electron: any;


@Injectable()
export abstract class AbstractIPCService {

  IPCRequestsMap: Object;

  ipcRenderer = electron.ipcRenderer;

  cache: any;
  i: number;

  constructor() {
    this.cache = {};
    this.i = 0;
    this.init();
  }

  init(): void {
    console.log('Initializing Abstract IPC service, requesting requestsMap');
    //response channel
    let self = this;
    this.on('web3-res-channel', function (event, arg) {
      console.log('Got response', JSON.stringify(arg));
      let id = arg.id;
      if (!self.cache[id]) {
        throw new Error("Could not find this request in cache: " + JSON.stringify(event) + " , " + JSON.stringify(arg));
      }
      let observable = self.cache[id];
      observable.next(arg);
    })
    console.log('Subscribed web3-res-channel')
  }

  once(channel: string, callback) {
    return this.ipcRenderer.once(channel, callback);
  }

  on(channel: string, callback) {
    return this.ipcRenderer.on(channel, callback);
  }

  send(channel: string, ...args) {
    this.ipcRenderer.send(channel, args);
  }

  sendSync(channel: string, ...args) {
    return this.ipcRenderer.sendSync(channel, arguments);
  }

  request(method: string, params?: any): Subject<any> {
    console.log('Requested ' + method);
    this.i++;
    this.ipcRenderer.send('web3-req-channel', {id: this.i, data: {method: method, params: params}});
    let myObservable = new Subject();
    this.cache[this.i] = myObservable;
    return myObservable;
  }


}
