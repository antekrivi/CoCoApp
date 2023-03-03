import { TestBed } from '@angular/core/testing';

import { RadnjaService } from './radnja.service';

describe('RadnjaService', () => {
  let service: RadnjaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RadnjaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
