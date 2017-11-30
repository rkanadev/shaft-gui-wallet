  import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IPCService} from "./service/ipc/concrete/ipc.service";

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [ // components that we want to make available
  ],
  declarations: [ // components for use in THIS module
  ],
  providers: [ // singleton services
    IPCService
  ]
})
export class CoreModule { }
