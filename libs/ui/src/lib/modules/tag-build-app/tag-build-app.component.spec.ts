import { TestBed } from '@angular/core/testing';
import { TagBuildAppComponent } from './tag-build-app.component';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('TagBuildAppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagBuildAppComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  it('starts with an empty example input list', () => {
    const fixture = TestBed.createComponent(TagBuildAppComponent);
    expect(fixture.componentInstance.exampleInputJson).toEqual([]);
  });
});
