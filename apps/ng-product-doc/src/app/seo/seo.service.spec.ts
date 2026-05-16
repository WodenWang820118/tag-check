import '@angular/localize/init';
import { DOCUMENT } from '@angular/common';
import { Component, LOCALE_ID } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { SeoService } from './seo.service';

const CANONICAL_ORIGIN = 'https://tag-check-documentation.vercel.app';
const LANDING_TITLE =
  'TagCheck | GTM Validation & Audit Tool for Digital Marketers';
const DOCS_TITLE = 'Getting Started | TagCheck Documentation';
const INTRODUCTION_TITLE = 'Introduction | TagCheck Documentation';

const SEO_LOCALE_CASES = [
  {
    localeId: 'en-US',
    htmlLang: 'en',
    urlSegment: 'en'
  },
  {
    localeId: 'zh-Hant',
    htmlLang: 'zh-Hant',
    urlSegment: 'zh-hant'
  },
  {
    localeId: 'zh-Hans',
    htmlLang: 'zh-Hans',
    urlSegment: 'zh-hans'
  },
  {
    localeId: 'ja',
    htmlLang: 'ja',
    urlSegment: 'ja'
  }
] as const;

@Component({
  selector: 'app-seo-test-host',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
class SeoTestHostComponent {}

@Component({
  selector: 'app-seo-test-page',
  standalone: true,
  template: ''
})
class SeoTestPageComponent {}

describe('SeoService', () => {
  for (const localeCase of SEO_LOCALE_CASES) {
    describe(localeCase.localeId, () => {
      let fixture: ComponentFixture<SeoTestHostComponent>;
      let router: Router;
      let seo: SeoService;
      let title: Title;
      let meta: Meta;
      let document: Document;

      beforeEach(async () => {
        await TestBed.configureTestingModule({
          imports: [SeoTestHostComponent, SeoTestPageComponent],
          providers: [
            { provide: LOCALE_ID, useValue: localeCase.localeId },
            provideRouter([
              {
                path: '',
                component: SeoTestPageComponent,
                data: { seoKey: 'landing' }
              },
              {
                path: 'about',
                component: SeoTestPageComponent,
                data: { seoKey: 'about' }
              },
              {
                path: 'app',
                redirectTo: 'documentation/introduction',
                pathMatch: 'full'
              },
              {
                path: 'documentation/:name',
                component: SeoTestPageComponent,
                data: { seoKey: 'documentation' }
              }
            ])
          ]
        }).compileComponents();

        router = TestBed.inject(Router);
        seo = TestBed.inject(SeoService);
        title = TestBed.inject(Title);
        meta = TestBed.inject(Meta);
        document = TestBed.inject(DOCUMENT);
        fixture = TestBed.createComponent(SeoTestHostComponent);
        fixture.detectChanges();
        seo.start();
      });

      it('publishes indexable landing metadata and alternate locale links', async () => {
        await navigate('/');

        expect(title.getTitle()).toBe(LANDING_TITLE);
        expect(meta.getTag('name="robots"')?.content).toBe('index,follow');
        expect(meta.getTag('property="og:url"')?.content).toBe(
          `${CANONICAL_ORIGIN}/${localeCase.urlSegment}/`
        );
        expect(getCanonicalHref()).toBe(
          `${CANONICAL_ORIGIN}/${localeCase.urlSegment}/`
        );
        expect(document.documentElement.lang).toBe(localeCase.htmlLang);
        expect(
          document.querySelectorAll(
            'link[rel="alternate"][data-seo="tag-check-doc-seo-alternate"]'
          )
        ).toHaveLength(5);
        expect(
          document.getElementById('tag-check-doc-landing-json-ld')
        ).not.toBeNull();
      });

      it('publishes documentation metadata for the active slug', async () => {
        await navigate('/documentation/getting-started');

        expect(title.getTitle()).toBe(DOCS_TITLE);
        expect(meta.getTag('name="description"')?.content).toContain(
          'TagCheck project'
        );
        expect(getCanonicalHref()).toBe(
          `${CANONICAL_ORIGIN}/${localeCase.urlSegment}/documentation/getting-started`
        );
        expect(meta.getTag('property="og:url"')?.content).toBe(
          `${CANONICAL_ORIGIN}/${localeCase.urlSegment}/documentation/getting-started`
        );
      });

      it('redirects /app into the documentation entry and removes landing schema markup', async () => {
        await navigate('/');
        await navigate('/app');

        expect(router.url).toBe('/documentation/introduction');
        expect(title.getTitle()).toBe(INTRODUCTION_TITLE);
        expect(meta.getTag('name="robots"')?.content).toBe('index,follow');
        expect(getCanonicalHref()).toBe(
          `${CANONICAL_ORIGIN}/${localeCase.urlSegment}/documentation/introduction`
        );
        expect(
          document.getElementById('tag-check-doc-landing-json-ld')
        ).toBeNull();
      });

      async function navigate(url: string): Promise<void> {
        await router.navigateByUrl(url);
        fixture.detectChanges();
        await fixture.whenStable();
      }

      function getCanonicalHref(): string | null {
        return document
          .querySelector<HTMLLinkElement>('link[rel="canonical"]')
          ?.getAttribute('href');
      }
    });
  }
});
