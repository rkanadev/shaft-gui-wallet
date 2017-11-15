import { TestBed, inject } from '@angular/core/testing';
import {ElectronIPCService} from "./electron-ipc.service";


describe('ElectrumIPCService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ElectronIPCService]
    });
  });

  it('should be created', inject([ElectronIPCService], (service: ElectronIPCService) => {
    expect(service).toBeTruthy();
  }));

});
