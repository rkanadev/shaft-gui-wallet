import {Component, Input, OnInit} from '@angular/core';
import {NotificationService} from "../service/notification/notification.service";
import {IPCService} from "../service/ipc/concrete/ipc.service";

@Component({
  selector: 'shaft-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  providers: [NotificationService]
})
export class HeaderComponent implements OnInit {

  @Input() sidenav: any;
  private maximized: boolean;

  constructor(private NotificationService: NotificationService, private IPCService: IPCService) {
    this.maximized = false;
  }

  ngOnInit() {
    console.log('Header')
  }


  closeApp() {
    console.log('Exiting app');
    this.IPCService.sendExitApp().then(() => {
      this.NotificationService.notificate("Quiting app...");
    }, err => {
      this.NotificationService.notificate("Could not exit app: " + err);
    })
  }

  unmaximizeApp() {
    this.IPCService.unmaximizeApp().then(() => {
      this.maximized = false;
    }, err => {
      this.NotificationService.notificate("Could not unmaximize app: " + err);
    })
  }

  maximizeApp() {
    debugger
    if (this.maximized) {
      debugger
      this.maximized = false;
      this.unmaximizeApp();
    } else {
      debugger
      this.IPCService.maximizeApp().then(() => {
        this.maximized = true;
      }, err => {
        this.NotificationService.notificate("Could not maximize app: " + err);
      })
    }
  }

  minimizeApp() {
    this.IPCService.minimizeApp().then(() => {
    }, err => {
      this.NotificationService.notificate("Could not minimize app: " + err);
    })
  }

}
