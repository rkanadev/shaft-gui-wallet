import { TestBed, inject } from '@angular/core/testing';
import {Web3IPCService} from "./web3-ipc.service";


describe('Web3IPCService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Web3IPCService]
    });
  });

  it('should be created', inject([Web3IPCService], (service: Web3IPCService) => {
    expect(service).toBeTruthy();
  }));

});
