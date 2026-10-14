import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Artwork } from './artwork';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('Artwork', () => {
  let component: Artwork;
  let fixture: ComponentFixture<Artwork>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Artwork],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Artwork);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
