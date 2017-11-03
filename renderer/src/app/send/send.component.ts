import {Component, Inject, Input, OnInit} from '@angular/core';
import {Web3IPCService} from "../service/ipc/web3/web3-ipc.service";
import BigNumber from "bignumber.js";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material";
import {CreateAccountDialog} from "../accounts/accounts.component";

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.css']
})
export class SendComponent implements OnInit {

  private accounts: string[];
  private from: string;
  private to: string;
  private value: number;

  private error: boolean;

  constructor(private Web3IPCService: Web3IPCService, public dialog: MatDialog) {
    this.from = null;
    this.to = null;
    this.value = null;

    this.accounts = [];
    Web3IPCService.getAccounts().then((accounts) => {
      this.accounts = accounts;
    }, err => {
      console.log('Error:', err);
    })


  }

  openSendDialog(): void {
    let dialogRef = this.dialog.open(SendDialog, {
      width: '80%',
      data: {from: this.from, to: this.to, value: this.value}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Submitting sending new transaction:', result);
        let from = this.from;
        let to = this.to;
        let valueInShf = new BigNumber(this.value);
        let valueInWei = valueInShf.mul(new BigNumber(1000000000000000000));
        //todo Validate

        let obj = {from: from, to: to, value: valueInWei.toString(10)};
        console.log(obj);
         this.Web3IPCService.sendTransaction(obj).then(result => {
           console.log('Successfully sent transaction: ', result);
           console.log(result);
           this.from = null;
           this.to = null;
           this.value = null;
         }, error => {
           console.log('Error pushing transaction:', error);

         })
      }
    });
  }


  sendTransaction() {
    if (!this.from && !this.to && !this.value) {
      console.log('Not enough arguments to send transaction');
      return;
    }
    let valueInWei = new BigNumber(this.value).mul(new BigNumber(1000000000000000000));
    let inShf = new BigNumber(this.value);
    //todo validate
    console.log(`Sending from ${this.from} to ${this.to} [SHF: ${inShf.toString(10)}, WEI: ${valueInWei.toString(10)}]`);
    this.Web3IPCService.sendTransaction({from: this.from, to: this.to, value: this.value}).then((receipt) => {
      console.log('Success', receipt);
    }, err => {
      console.log('Error while sending transaction', err);
      this.error = true;
    })
  }


  ngOnInit() {
  }

}

@Component({
  selector: 'send-dialog',
  templateUrl: 'send-dialog.html',
  styleUrls: ['./send-dialog.css']
})
export class SendDialog {

  private password: string;
  private unlocked: boolean;
  private unlocking: boolean;
  private passwordInvalid: boolean;

  constructor(public dialogRef: MatDialogRef<CreateAccountDialog>,
              @Inject(MAT_DIALOG_DATA) public data: any, private Web3IPCService: Web3IPCService) {
    this.password = null;
    this.unlocked = false;
    this.unlocking = false;
    this.passwordInvalid = false;
  }

  public lockAccount(account) {
    this.Web3IPCService.lockAccount(account).then((locked) => {
      console.log('Account locked', locked);
    }, err => {
      console.log(err)
    })
  }

  public unlockAccount(account, password) {
    console.log(this.data);
    this.unlocking = true;
    this.Web3IPCService.unlockAccount(account, password).then((unlocked:boolean) => {
      this.unlocking = false;
      console.log('Account unlocked', unlocked);
      this.unlocked = unlocked;
      if(unlocked) {
        this.unlocked = true;
        this.passwordInvalid = false;
      }
    }, err => {
      this.unlocking = false;
      if(err === 'could not decrypt key with given passphrase') {
        this.passwordInvalid = true;
      }
      console.log(err)
    })
  }

  onNoClick(): void {
    this.data.password = null;
    this.dialogRef.close();
  }

}
