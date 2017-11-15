import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Web3IPCService } from './service/ipc/web3/web3-ipc.service';
import {ElectronIPCService} from "./service/ipc/electron/electron-ipc.service";

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [ // components that we want to make available
  ],
  declarations: [ // components for use in THIS module
  ],
  providers: [ // singleton services
    Web3IPCService,
    ElectronIPCService
  ]
})
export class CoreModule { }
