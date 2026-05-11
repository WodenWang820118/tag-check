import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'zh-Hans' }]
    }).compileComponents();
  });

  it('renders one primary H1 for the marketing landing page', () => {
    const fixture = TestBed.createComponent(LandingPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('h1')).toHaveLength(1);
  });

  it('links primary actions to the localized app and content pages', () => {
    const fixture = TestBed.createComponent(LandingPageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.appPath).toBe('/zh-hans/app');
    expect(fixture.componentInstance.aboutPath).toBe('/zh-hans/about');
    expect(fixture.componentInstance.objectivesPath).toBe(
      '/zh-hans/objectives'
    );
    expect(
      fixture.nativeElement
        .querySelector('.button--primary')
        ?.getAttribute('href')
    ).toBe('/zh-hans/app');
  });
});
