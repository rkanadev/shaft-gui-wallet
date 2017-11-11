import {Component, Inject, OnInit} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {Web3IPCService} from "../service/ipc/web3/web3-ipc.service";
import {Observable} from "rxjs/Observable";

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {

  private accounts: object;
  private password: string;
  private passwordConfirm: string;

  constructor(private Web3IPCService: Web3IPCService, public dialog: MatDialog) {
    this.accounts = [];
  }

  public getBalance(address) {
    let account = this.accounts[address];
    if (account === null) {
      return 0;
    } else {
      return (Math.round(account.balance/1000000000000000000)*10000)/10000;
    }
  }

  public getAccounts() {
    this.Web3IPCService.getAccounts().then(result => {
      //Get balance
      Observable.from(result).subscribe((address: string) => {
        this.Web3IPCService.getBalance(address).then((result) => {
          this.accounts[address] = {balance: result}
        }, err => {
          console.log('Error', err);
          this.accounts[address] = {balance: result, error: err}
        })
      });
    }, error => {
      console.log(error);
    });
  }

  public getAccountsAsArray(): string[] {
    let result = [];
    let accounts = this.accounts;
    Object.keys(accounts).forEach(function (key) {
      result.push(key);
    });
    return result;
  }


  openCreateAccountDialog(): void {
    let dialogRef = this.dialog.open(CreateAccountDialog, {
      width: '50%',
      data: {password: this.password, passwordConfirm: this.passwordConfirm}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Submitting create account with password:', result);
        this.Web3IPCService.newAccount(result).then(result => {
          console.log('Successfully created account. Address: ', result, result.json());
          this.getAccounts();
        }, error => {
          console.log('Error while creating account', error);
        })
      }
    });
  }

  ngOnInit() {
    this.getAccounts();
  }

}

@Component({
  selector: 'create-account-dialog',
  templateUrl: 'create-account-dialog.html',
  styleUrls: ['./create-account-dialog.css']
})
export class CreateAccountDialog {

  constructor(public dialogRef: MatDialogRef<CreateAccountDialog>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  submitCreateAccountDialog() {
    console.log('Password:', this.data.password);
  }

  onNoClick(): void {
    this.data.password = null;
    this.dialogRef.close();

  }

}
