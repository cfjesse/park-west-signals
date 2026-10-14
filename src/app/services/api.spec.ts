import { TestBed } from '@angular/core/testing';
import { ArtworkApi } from './artwork.api';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ArtworkApi', () => {
  let service: ArtworkApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ArtworkApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

