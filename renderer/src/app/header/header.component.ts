import {Component, Input, OnInit} from '@angular/core';
import {NotificationService} from "../service/notification/notification.service";
import {ElectronIPCService} from "../service/ipc/electron/electron-ipc.service";

@Component({
  selector: 'shaft-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  providers: [NotificationService]
})
export class HeaderComponent implements OnInit {

  @Input() sidenav: any;

  constructor(private NotificationService: NotificationService, private ElectronIPCService: ElectronIPCService) {

  }

  ngOnInit() {
    console.log('Header')
  }


  closeApp() {
    console.log('Exiting app');
    this.ElectronIPCService.sendExitApp().then(() => {
      this.NotificationService.notificate("Quiting app...");
    }, err => {
      this.NotificationService.notificate("Could not exit app: " + err);
    })
  }

  maximizeApp() {
    this.ElectronIPCService.maximizeApp().then(() => {
    }, err => {
      this.NotificationService.notificate("Could not maximize app: " + err);
    })
  }

  minimizeApp() {
    this.ElectronIPCService.minimizeApp().then(() => {
    }, err => {
      this.NotificationService.notificate("Could not minimize app: " + err);
    })
  }

}
