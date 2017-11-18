import {Component, Inject, OnInit} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {Observable} from "rxjs/Observable";
import {AccountIconService} from "../service/account-icon/account-icon.service";
import {IPCService} from "../service/ipc/concrete/ipc.service";
import {NotificationService} from "../service/notification/notification.service";

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css'],
  providers: [AccountIconService, NotificationService],
})
export class AccountsComponent implements OnInit {

  private accounts: object;
  private password: string;
  private passwordConfirm: string;

  constructor(private IPCService: IPCService, private AccountIconService: AccountIconService, public dialog: MatDialog, private NotificationService: NotificationService) {
    this.accounts = [];
  }

  public getBalance(address) {
    let account = this.accounts[address];
    if (account === null) {
      return 0;
    } else {
      return (Math.round(account.balance / 1000000000000000000) * 10000) / 10000;
    }
  }

  public getAccounts() {
    this.IPCService.getAccounts().then(result => {
      //Get balance
      Observable.from(result).subscribe((address: string) => {
        this.IPCService.getBalance(address).then((result) => {
          this.IPCService.getAddressLabel(address).then((label) => {
            this.accounts[address] = {
              balance: result,
              label: label,
              iconBase64Url: this.AccountIconService.getIconBase64(address)
            }
          }, err => {
            console.log('Could not get label for ' + address + '. Probably not set.' + err);
            this.accounts[address] = {
              balance: result,
              label: address.substr(0, 8),
              iconBase64Url: this.AccountIconService.getIconBase64(address)
            }
          });
        }, err => {
          this.NotificationService.notificate('Could not get balance for' + err);
          this.accounts[address] = {balance: result, error: err}
        })
      });
    }, error => {
      this.NotificationService.notificate("Could not get accounts from node: " + error);
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
        this.IPCService.newAccount(result).then(result => {
          this.NotificationService.notificate('Successfully created account. Address: ' + result);
          this.getAccounts();
        }, error => {
          this.NotificationService.notificate('Error while creating account: ' + error);
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
