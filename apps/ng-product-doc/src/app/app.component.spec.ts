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
        { provide: LOCALE_ID, useValue: 'zh-Hant' },
        { provide: SeoService, useValue: seo },
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  it('wires the toolbar primary navigation to the localized documentation entry', () => {
    const fixture = renderApp();
    const primaryLink = getPrimaryMenuLink(fixture);

    expect(getLinkLabel(primaryLink)).toBe('Getting Started');
    expect(primaryLink.getAttribute('href')).toBe(
      '/zh-hant/documentation/introduction'
    );
    expect(seo.start).toHaveBeenCalledOnce();
  });
});

function renderApp(): ComponentFixture<AppComponent> {
  const fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();

  return fixture;
}

function getPrimaryMenuLink(
  fixture: ComponentFixture<AppComponent>
): HTMLAnchorElement {
  const link = fixture.nativeElement.querySelector(
    'lib-menu-tabs a'
  ) as HTMLAnchorElement | null;

  expect(link).toBeTruthy();

  return link as HTMLAnchorElement;
}

function getLinkLabel(link: HTMLAnchorElement): string {
  const label = link.querySelector('.nav-text');

  expect(label).toBeTruthy();

  return label?.textContent?.trim() ?? '';
}
