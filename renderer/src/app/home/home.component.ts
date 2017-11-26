import {ChangeDetectorRef, Component, Inject, OnInit} from '@angular/core';
import {Observable} from "rxjs/Observable";
import {debug} from "util";
import {UnitConvertWeiToEther} from "../util/pipes/unit-converter-pipe";
import {IPCService} from "../service/ipc/concrete/ipc.service";
import {Transaction} from "../model/Transaction";
import {NotificationService} from "../service/notification/notification.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material";
import {CreateAccountDialog} from "../accounts/accounts.component";
import BigNumber from "bignumber.js";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [UnitConvertWeiToEther, NotificationService]
})

export class HomeComponent implements OnInit {

  public accounts: object;
  public transactions: Transaction[];
  public minedBlocks: {}[];
  public difficulty: number;

  constructor(private IPCService: IPCService, private UnitConvertWeiToEther: UnitConvertWeiToEther, private NotificationService: NotificationService, public dialog: MatDialog) {
    console.log('Home loaded');
    this.accounts = {};
    this.transactions = [];
    this.minedBlocks = [];

    this.IPCService.getMinedBlocks().then((result: any) => {
      this.minedBlocks = result;
    }, err => {
      this.NotificationService.notificate("Could not get mined blocks: " + err);
    });

    this.IPCService.getDifficulty().then((diff: number) => {
      this.difficulty = diff;
    }, err => {
      this.NotificationService.notificate("Could not get difficulty");
      this.difficulty = null
    });


    this.IPCService.getAccounts().then(accounts => {
      accounts.forEach((account) => {
        this.accounts[account] = {account: account};
        this.IPCService.getBalance(account).then((balance) => {
          this.accounts[account].balance = balance;
        }, function (error) {
          console.log(error);
        });
        this.IPCService.getTransactionsByAddress(account).then((result) => {
          this.accounts[account].transactions = result;
        }, error => {
          this.NotificationService.notificate('Unable to get transactions by address ' + account)
        })
      });

    }, error => {
      this.NotificationService.notificate('Could not get all accounts: ' + error);
      console.log(error);
      this.accounts = []
    });
  }

  public getDiffHumanReadable() {
    if (!this.difficulty) {
      return "N/A";
    } else {
      let diff = this.difficulty;
      diff = diff / 1000; // K
      diff = diff / 1000; // M
      return Math.round(diff * 100) / 100;
    }
  }


  ngOnInit() {
  }

  getAccountsAsArray(): string[] {
    let res = Object.keys(this.accounts);
    return res;
  }

  getTotalBalance(): string {
    let result = 0;
    Object.keys(this.accounts).forEach((key, index) => {
      if (this.accounts[key].balance) {
        result += parseFloat(this.UnitConvertWeiToEther.transform(this.accounts[key].balance));
      }
    });
    return (Math.round(result*10000)/10000).toString();
  }

  getAllTransactions() {
    let result = [];
    let self = this;
    Object.keys(this.accounts).forEach(function (account) {
      let transactions = self.accounts[account].transactions;
      if (transactions) {
        //console.log('Account', account, JSON.stringify(transactions));
        transactions.forEach((tx) => {
          result.push(tx)
        });
      }
    });
    return result;
  }


  isOwnAddress(address) {
    let result = false;
    Object.keys(this.accounts).forEach(function (account) {
      if (account === address) {
        result = true;
      }
    });
    return result;
  }


  openTransactionDetailsDialog(txHash): void {
    this.IPCService.getTransactionByHash(txHash).then((tx: Transaction) => {


        let dialogRef = this.dialog.open(TransactionDetailsDialog, {
          data: {transaction: tx}
        });

        dialogRef.afterClosed().subscribe(result => {
          /*if (result) {
            this.IPCService.newAccount(result).then(result => {
              this.NotificationService.notificate('Successfully created account. Address: ' + result);
              this.getAccounts();
            }, error => {
              this.NotificationService.notificate('Error while creating account: ' + error);
            })
          }*/
        });
      },
      err => {
        this.NotificationService.notificate(`Could not get transaction with hash: ${txHash}. Error: ${err}`);
      });


  }
}


@Component({
  selector: 'transaction-details-dialog',
  templateUrl: 'transaction-details-dialog.html',
  styleUrls: ['./transaction-details-dialog.css']
})
export class TransactionDetailsDialog {
  transaction: any;

  constructor(public dialogRef: MatDialogRef<TransactionDetailsDialog>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    this.transaction = data.transaction;
  }

  submitTransactionDetailsDialog() {
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  fromBigNumberToDecimal(bigNumber) {
    return new BigNumber(bigNumber).toString(10);
  }

}
