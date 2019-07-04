import { TestBed } from '@angular/core/testing';

import { AqserviceService } from './aqservice.service';

describe('AqserviceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AqserviceService = TestBed.get(AqserviceService);
    expect(service).toBeTruthy();
  });
});
