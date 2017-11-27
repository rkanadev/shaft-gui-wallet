import {Component} from '@angular/core';
import {IPCService} from "./service/ipc/concrete/ipc.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  initialized: boolean;

  constructor(private IPCService: IPCService) {
    this.initialized = false;
    this.checkIsInitialized();
  }

  public checkIsInitialized() {
    let self = this;
    this.IPCService.isInitialized().then((inited: boolean) => {
      this.initialized = inited;
      if (!inited) {
        console.log('App is not initialized yet, retrying in 1 sec');
        setTimeout(function () {
          self.checkIsInitialized();
        }, 1000)
      }
    })
  }
}
