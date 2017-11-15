import { TestBed, inject } from '@angular/core/testing';
import {IPCService} from "./ipc.service";

describe('IpcserviceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IPCService]
    });
  });

  it('should be created', inject([IPCService], (service: IPCService) => {
    expect(service).toBeTruthy();
  }));
});
