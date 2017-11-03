import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {IntervalObservable} from "rxjs/observable/IntervalObservable";
import {Subscribable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";
import {Web3IPCService} from "../service/ipc/web3/web3-ipc.service";

@Component({
  selector: 'shaft-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit, OnDestroy {


  private syncing: boolean;
  private peerCount: number;
  private blockNumber: number | string;
  private error: boolean;
  private tickSubscription: Subscription;

  constructor(private Web3IPCService: Web3IPCService) {
    this.blockNumber = 0;
    this.peerCount = 0;

    console.log(this.Web3IPCService);
     this.tickSubscription = Observable.interval(1000 * 10).startWith(1)
       .subscribe(() => {
         this.tick();
       });
    this.tick();

  }

  tick() {
    this.Web3IPCService.isSyncing().then((result: boolean) => {
      this.syncing = result;
    }, err => {
      this.syncing = false;
    });

    this.Web3IPCService.getPeerCount().then((result: number) => {
      this.peerCount = result;
    }, err => this.peerCount = 0);

    this.Web3IPCService.getBlockCount().then((result: number) => {
      this.blockNumber = result;
    }, (err) => {
      this.blockNumber = 0;
    });
  }

  getBlockNumber() {
    return this.blockNumber;
  }

  getPeerCount() {
    return this.peerCount;
  }

  getSyncing() {
    return this.syncing;
  }


  ngOnInit() {

  }

  ngOnDestroy(): void {
    this.tickSubscription.unsubscribe();
  }

}
