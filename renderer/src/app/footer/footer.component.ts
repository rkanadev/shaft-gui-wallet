import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {Subscription} from "rxjs/Subscription";
import {IPCService} from "../service/ipc/concrete/ipc.service";

@Component({
  selector: 'shaft-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit, OnDestroy {


  private syncing: string;
  private peerCount: number;
  private blockNumber: number | string;
  private error: boolean;
  private tickSubscription: Subscription;

  constructor(private IPCService: IPCService) {
    this.blockNumber = 0;
    this.peerCount = 0;

    this.tickSubscription = Observable.interval(1000 * 10).startWith(1)
      .subscribe(() => {
        this.tick();
      });
    this.tick();

  }

  tick() {
    this.IPCService.isSyncing().then((result: string) => {
      this.syncing = result;
    }, err => {
      this.syncing = "Not syncing (error)";
    });

    this.IPCService.getPeerCount().then((result: number) => {
      this.peerCount = result;
    }, err => this.peerCount = 0);

    this.IPCService.getBlockCount().then((result: number) => {
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

  private appendZero(str) {
    if (str.length === 1) {
      str = '0' + str;
    }
    return str;
  }

  getDateStr() {
    //hell, we need momentjs
    let date = new Date();

    let day = '' + date.getDay();
    day = this.appendZero(day);

    let month = '' + (date.getMonth() + 1);
    month = this.appendZero(month);

    let year = '' + date.getFullYear();
    year = this.appendZero(year);

    return `${day}.${month}.${year}`;
  }

  getTimeStr() {
    //hell, we need momentjs


    let date = new Date();

    let hours = '' + date.getHours();
    hours = this.appendZero(hours);

    let minutes = '' + date.getMinutes();
    minutes = this.appendZero(minutes);


    return `${hours}:${minutes}`;
  }


  ngOnInit() {

  }

  ngOnDestroy(): void {
    this.tickSubscription.unsubscribe();
  }

}
