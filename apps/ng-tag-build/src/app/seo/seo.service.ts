import { DOCUMENT } from '@angular/common';
import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  SUPPORTED_LOCALES,
  buildLocalizedPath,
  getLocaleConfig,
  isIndexableLogicalRoute
} from '@ui';
import { filter } from 'rxjs';

const CANONICAL_ORIGIN = 'https://tag-build.vercel.app';
const OG_IMAGE_URL = `${CANONICAL_ORIGIN}/assets/images/tagbuild-og.png`;
const ALTERNATE_MARKER = 'tag-build-seo-alternate';
const LANDING_JSON_LD_ID = 'tag-build-landing-json-ld';

type SeoKey = 'landing' | 'about' | 'objectives' | 'app';

interface RouteSeoConfig {
  readonly logicalPath: string;
  readonly title: string;
  readonly description: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly locale = getLocaleConfig(inject(LOCALE_ID));
  private started = false;

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.applyCurrentRouteSeo();
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe(() => this.applyCurrentRouteSeo());
  }

  applyCurrentRouteSeo(): void {
    const seo = this.getRouteSeo(this.getActiveSeoKey());
    const canonicalUrl = this.buildAbsoluteUrl(seo.logicalPath);
    const robots = isIndexableLogicalRoute(seo.logicalPath)
      ? 'index,follow'
      : 'noindex,follow';

    this.document.documentElement.lang = this.locale.hreflang;
    this.title.setTitle(seo.title);
    this.updateMeta(seo, canonicalUrl, robots);
    this.updateCanonical(canonicalUrl);
    this.updateAlternates(seo.logicalPath);
    this.updateLandingJsonLd(seo, canonicalUrl);
  }

  private getActiveSeoKey(): SeoKey {
    let activeRoute = this.route.snapshot;

    while (activeRoute.firstChild) {
      activeRoute = activeRoute.firstChild;
    }

    return (activeRoute.data['seoKey'] as SeoKey | undefined) ?? 'landing';
  }

  private getRouteSeo(seoKey: SeoKey): RouteSeoConfig {
    const routeSeo = {
      landing: {
        logicalPath: '/',
        title: $localize`:@@seo.landing.title:Tag Build | Fast GTM JSON Builder for GA4 Teams`,
        description: $localize`:@@seo.landing.description:Build Google Tag Manager-ready JSON for GA4 events with a static, multilingual workflow designed for SEO specialists and marketing teams.`
      },
      about: {
        logicalPath: '/about',
        title: $localize`:@@seo.about.title:About Tag Build | GA4 Tag Workflow`,
        description: $localize`:@@seo.about.description:Learn how Tag Build helps marketers and SEO teams generate structured GTM payloads without complex Google Cloud infrastructure.`
      },
      objectives: {
        logicalPath: '/objectives',
        title: $localize`:@@seo.objectives.title:Tag Build Objectives | Reliable GTM Handoffs`,
        description: $localize`:@@seo.objectives.description:Review Tag Build's goals for reducing tracking complexity, improving GTM handoffs, and connecting build work with validation.`
      },
      app: {
        logicalPath: '/app',
        title: $localize`:@@seo.app.title:Tag Build App | GTM JSON Editor`,
        description: $localize`:@@seo.app.description:Open the client-side Tag Build editor to prepare GTM-ready JSON payloads for GA4 event implementation.`
      }
    } satisfies Record<SeoKey, RouteSeoConfig>;

    return routeSeo[seoKey];
  }

  private updateMeta(
    seo: RouteSeoConfig,
    canonicalUrl: string,
    robots: string
  ): void {
    const locale = this.locale.hreflang;

    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({
      name: 'keywords',
      content:
        'Google Tag Manager, GTM Automation, Tag Build, GA4, JSON Configuration, SEO Tools'
    });
    this.meta.updateTag({ property: 'og:title', content: seo.title });
    this.meta.updateTag({
      property: 'og:description',
      content: seo.description
    });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:image', content: OG_IMAGE_URL });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ property: 'og:locale', content: locale });
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });
    this.meta.updateTag({ name: 'twitter:title', content: seo.title });
    this.meta.updateTag({
      name: 'twitter:description',
      content: seo.description
    });
    this.meta.updateTag({ name: 'twitter:image', content: OG_IMAGE_URL });
  }

  private updateCanonical(canonicalUrl: string): void {
    const link = this.getOrCreateLink('canonical');
    link.href = canonicalUrl;
  }

  private updateAlternates(logicalPath: string): void {
    this.document
      .querySelectorAll(`link[rel="alternate"][data-seo="${ALTERNATE_MARKER}"]`)
      .forEach((link) => link.remove());

    for (const locale of SUPPORTED_LOCALES) {
      this.appendAlternate(
        locale.hreflang,
        this.buildAbsoluteUrl(logicalPath, locale)
      );
    }

    this.appendAlternate(
      'x-default',
      this.buildAbsoluteUrl(logicalPath, SUPPORTED_LOCALES[0])
    );
  }

  private appendAlternate(hreflang: string, href: string): void {
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    link.setAttribute('href', href);
    link.setAttribute('data-seo', ALTERNATE_MARKER);
    this.document.head.appendChild(link);
  }

  private updateLandingJsonLd(seo: RouteSeoConfig, canonicalUrl: string): void {
    const existing = this.document.getElementById(LANDING_JSON_LD_ID);

    if (seo.logicalPath !== '/') {
      existing?.remove();
      return;
    }

    const script =
      existing ??
      Object.assign(this.document.createElement('script'), {
        id: LANDING_JSON_LD_ID,
        type: 'application/ld+json'
      });

    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Tag Build',
      url: canonicalUrl,
      description: seo.description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      inLanguage: this.locale.hreflang,
      image: OG_IMAGE_URL,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    });

    if (!existing) {
      this.document.head.appendChild(script);
    }
  }

  private getOrCreateLink(rel: string): HTMLLinkElement {
    const existing = this.document.querySelector<HTMLLinkElement>(
      `link[rel="${rel}"]`
    );

    if (existing) {
      return existing;
    }

    const link = this.document.createElement('link');
    link.rel = rel;
    this.document.head.appendChild(link);
    return link;
  }

  private buildAbsoluteUrl(logicalPath: string, locale = this.locale): string {
    return `${CANONICAL_ORIGIN}${buildLocalizedPath(logicalPath, locale)}`;
  }
}
