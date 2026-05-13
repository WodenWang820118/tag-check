import '@angular/localize/init';
import { LOCALE_ID } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppComponent } from './app.component';
import { SeoService } from './seo/seo.service';

describe('AppComponent', () => {
  const seo = {
    start: vi.fn()
  };

  beforeEach(async () => {
    seo.start.mockReset();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'ja' },
        { provide: SeoService, useValue: seo },
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  it('keeps the toolbar navigation inside ng-tag-build', () => {
    const fixture = renderApp();
    const menuLinks = getMenuLinks(fixture);
    const [appLink] = menuLinks;

    expect(getLinkLabel(appLink)).toBe('App');
    expect(appLink.getAttribute('href')).toBe('/ja/app');
    expect(menuLinks.map(getLinkLabel)).not.toContain('Getting Started');
    expect(
      menuLinks.some((link) =>
        (link.getAttribute('href') ?? '').includes('documentation')
      )
    ).toBe(false);
    expect(seo.start).toHaveBeenCalledOnce();
  });
});

function renderApp(): ComponentFixture<AppComponent> {
  const fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();

  return fixture;
}

function getMenuLinks(
  fixture: ComponentFixture<AppComponent>
): HTMLAnchorElement[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('lib-menu-tabs a')
  ) as HTMLAnchorElement[];
}

function getLinkLabel(link: HTMLAnchorElement): string {
  const label = link.querySelector('.nav-text');

  expect(label).toBeTruthy();

  return label?.textContent?.trim() ?? '';
}
