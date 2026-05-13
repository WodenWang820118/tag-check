import '@angular/localize/init';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { LandingPageComponent } from './landing-page';

describe('ng-tag-build LandingPageComponent', () => {
  it('keeps the localized app route as the primary CTA', async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'ja' }]
    }).compileComponents();

    const fixture = TestBed.createComponent(LandingPageComponent);
    fixture.detectChanges();

    const primaryLink = fixture.nativeElement.querySelector(
      '.button--primary'
    ) as HTMLAnchorElement | null;

    expect(primaryLink).toBeTruthy();
    expect(primaryLink?.textContent?.trim()).toBe('Open Tag Build');
    expect(primaryLink?.getAttribute('href')).toBe('/ja/app');
    expect(primaryLink?.getAttribute('href')).not.toContain('documentation');
  });
});
