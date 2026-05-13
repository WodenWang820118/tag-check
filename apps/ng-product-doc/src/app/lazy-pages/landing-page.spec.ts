import '@angular/localize/init';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { LandingPageComponent } from './landing-page';

describe('ng-product-doc LandingPageComponent', () => {
  it('uses the localized documentation intro as the primary CTA', async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'zh-Hant' }]
    }).compileComponents();

    const fixture = TestBed.createComponent(LandingPageComponent);
    fixture.detectChanges();

    const primaryLink = fixture.nativeElement.querySelector(
      '.button--primary'
    ) as HTMLAnchorElement | null;

    expect(primaryLink).toBeTruthy();
    expect(primaryLink?.textContent?.trim()).toBe('Getting Started');
    expect(primaryLink?.getAttribute('href')).toBe(
      '/zh-hant/documentation/introduction'
    );
  });
});
