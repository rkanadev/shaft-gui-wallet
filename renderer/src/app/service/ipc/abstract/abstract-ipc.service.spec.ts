import { TestBed, inject } from '@angular/core/testing';

import { AbstractIPCService } from './abstract-ipc.service';

describe('AbstractIPCService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AbstractIPCService]
    });
  });

  it('should be created', inject([AbstractIPCService], (service: AbstractIPCService) => {
    expect(service).toBeTruthy();
  }));
});
