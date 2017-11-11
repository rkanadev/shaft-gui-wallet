import { TestBed, inject } from '@angular/core/testing';

import { AccountIconService } from './account-icon.service';

describe('AccountIconService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AccountIconService]
    });
  });

  it('should be created', inject([AccountIconService], (service: AccountIconService) => {
    expect(service).toBeTruthy();
  }));
});
