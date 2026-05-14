import { DOCUMENT } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { SeoService } from './seo.service';

const CANONICAL_ORIGIN = 'https://ng-gtm-integration-sample.vercel.app';

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
        provideRouter([
          {
            path: 'home',
            component: SeoTestPageComponent,
            data: { seoKey: 'home' }
          },
          {
            path: 'product/destinations',
            component: SeoTestPageComponent,
            data: { seoKey: 'destinations' }
          },
          {
            path: 'product/details/:slug',
            component: SeoTestPageComponent,
            data: { seoKey: 'destination-detail' }
          },
          {
            path: 'home/login',
            component: SeoTestPageComponent,
            data: { seoKey: 'login' }
          },
          {
            path: '404',
            component: SeoTestPageComponent,
            data: { seoKey: 'not-found' }
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

  it('forces noindex metadata in non-production environments even for public pages', async () => {
    await navigate('/home');

    expect(title.getTitle()).toBe('Travel With GTM | Demo Travel Catalog');
    expect(meta.getTag('name="description"')?.content).toContain(
      'prerendered demo experience'
    );
    expect(meta.getTag('name="robots"')?.content).toBe('noindex,nofollow');
    expect(meta.getTag('property="og:url"')?.content).toBe(
      `${CANONICAL_ORIGIN}/home`
    );
    expect(getCanonicalHref()).toBe(`${CANONICAL_ORIGIN}/home`);
  });

  it('publishes destination detail canonicals and social metadata from the slug route', async () => {
    await navigate('/product/details/san-francisco');

    expect(title.getTitle()).toBe('San Francisco | Travel With GTM');
    expect(meta.getTag('name="description"')?.content).toContain(
      'San Francisco'
    );
    expect(meta.getTag('property="og:url"')?.content).toBe(
      `${CANONICAL_ORIGIN}/product/details/san-francisco`
    );
    expect(meta.getTag('property="og:image"')?.content).toBe(
      `${CANONICAL_ORIGIN}/assets/images/san_francisco_big.jpg`
    );
    expect(meta.getTag('name="twitter:image"')?.content).toBe(
      `${CANONICAL_ORIGIN}/assets/images/san_francisco_big.jpg`
    );
    expect(getCanonicalHref()).toBe(
      `${CANONICAL_ORIGIN}/product/details/san-francisco`
    );
  });

  it('keeps private flows non-indexable and falls back to the public 404 metadata for unknown slugs', async () => {
    await navigate('/home/login');

    expect(title.getTitle()).toBe('Login | Travel With GTM');
    expect(meta.getTag('name="robots"')?.content).toBe('noindex,nofollow');

    await navigate('/product/details/missing-slug');

    expect(title.getTitle()).toBe('Page Not Found | Travel With GTM');
    expect(meta.getTag('name="robots"')?.content).toBe('noindex,nofollow');
    expect(getCanonicalHref()).toBe(`${CANONICAL_ORIGIN}/404`);
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
