import {Injectable} from '@angular/core';
import {MatSnackBar} from "@angular/material";

declare var electron: any;

@Injectable()
export class NotificationService {

  private ipcRenderer = electron.ipcRenderer;

  constructor(public snackBar: MatSnackBar) {
    this.ipcRenderer.on('push-notification', (event, arg) => {
      this.notificate(arg);
    })

  }


  private openSnackBar(label, action) {
    if (!action) {
      action = "";
    }
    this.snackBar.open(label, action, {
      duration: 5000,
      extraClasses: ['snackbar-container']
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

  public notificate(message: string) {
    this.openSnackBar(message, null);
  }

}
