import {Injectable} from '@angular/core';
import {MatSnackBar} from "@angular/material";

@Injectable()
export class NotificationService {

  constructor(public snackBar: MatSnackBar) {
  }


  private openSnackBar(label, action) {
    if (!action) {
      action = "";
    }
    this.snackBar.open(label, action, {
      duration: 5000,
    });
  }

  public addressLabelSaved(label) {
    let str = `Successfully saved label from this address [${label}]`;
    this.openSnackBar(str, null);
  }


  public addressLabelRemoved() {
    let str = `Successfully removed label from this address`;
    this.openSnackBar(str, null);
  }

  public notificate(message:string) {
      this.openSnackBar(message, null);
  }

}
