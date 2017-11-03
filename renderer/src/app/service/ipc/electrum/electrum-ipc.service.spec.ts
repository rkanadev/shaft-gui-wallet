import { TestBed, inject } from '@angular/core/testing';

import { ElectrumIPCService } from './electrum-ipc.service';

describe('ElectrumIPCService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ElectrumIPCService]
    });
  });

  it('should be created', inject([ElectrumIPCService], (service: ElectrumIPCService) => {
    expect(service).toBeTruthy();
  }));

});
