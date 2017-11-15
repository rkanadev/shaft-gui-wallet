import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Observable} from "rxjs/Observable";
import {debug} from "util";
import BigNumber from "bignumber.js";
import {UnitConvertWeiToEther} from "../util/pipes/unit-converter-pipe";
import {IPCService} from "../service/ipc/concrete/ipc.service";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [UnitConvertWeiToEther]
})

export class HomeComponent implements OnInit {

  public accounts: object;

  constructor(private IPCService: IPCService, private UnitConvertWeiToEther: UnitConvertWeiToEther) {
    console.log('Home loaded');
    this.accounts = {};

    this.IPCService.getAccounts().then(accounts => {
      accounts.forEach((account) => {
        this.accounts[account] = {account: account};
        this.IPCService.getBalance(account).then((balance) => {
          this.accounts[account].balance = balance;
        }, function (error) {
          console.log(error);
        })
      });

    }, error => {
      console.log(error);
      this.accounts = []
    });

  }

  getAccountsAsArray(): string[] {
    let res = Object.keys(this.accounts);
    console.log('res', res);
    return res;
  }

  getTotalBalance(): string {
    let result = 0;
    Object.keys(this.accounts).forEach((key, index) => {
      if (this.accounts[key].balance) {
        result += parseFloat(this.UnitConvertWeiToEther.transform(this.accounts[key].balance));
      }
    });
    return result.toString();
  }

  ngOnInit() {

    console.log('Home loaded');

  }

}
