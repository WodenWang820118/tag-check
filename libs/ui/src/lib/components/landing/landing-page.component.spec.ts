import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  const primaryLink = {
    href: '/zh-hans/documentation/introduction',
    label: 'Getting Started',
    icon: 'menu_book',
    logicalPath: '/documentation',
    matchStrategy: 'prefix'
  } as const;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'zh-Hans' }]
    }).compileComponents();
  });

  it('renders one primary H1 for the marketing landing page', () => {
    const fixture = TestBed.createComponent(LandingPageComponent);
    fixture.componentRef.setInput('primaryLink', primaryLink);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('h1')).toHaveLength(1);
  });

  it('links primary actions to the host-provided destination and localized content pages', () => {
    const fixture = TestBed.createComponent(LandingPageComponent);
    fixture.componentRef.setInput('primaryLink', primaryLink);
    fixture.detectChanges();

    expect(fixture.componentInstance.aboutPath).toBe('/zh-hans/about');
    expect(fixture.componentInstance.objectivesPath).toBe(
      '/zh-hans/objectives'
    );
    expect(
      fixture.nativeElement
        .querySelector('.button--primary')
        ?.getAttribute('href')
    ).toBe(primaryLink.href);
    expect(
      fixture.nativeElement
        .querySelector('.button--primary')
        ?.textContent?.trim()
    ).toBe(primaryLink.label);
  });
});
