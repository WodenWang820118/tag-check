import { DOCUMENT } from '@angular/common';
import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  DOCUMENTATION_PAGES,
  SUPPORTED_LOCALES,
  buildLocalizedPath,
  getLocaleConfig,
  isIndexableLogicalRoute
} from '@ui';
import { filter } from 'rxjs';

const CANONICAL_ORIGIN = 'https://tag-check-documentation.vercel.app';
const OG_IMAGE_URL = `${CANONICAL_ORIGIN}/assets/images/tagcheck-og.png`;
const ALTERNATE_MARKER = 'tag-check-doc-seo-alternate';
const LANDING_JSON_LD_ID = 'tag-check-doc-landing-json-ld';
const KEYWORDS =
  'GTM validation, Tag audit, Google Tag Manager, TagCheck, Digital analytics, Marketing QA';
const DOCS_TITLE_SUFFIX = $localize`:@@seo.docs.titleSuffix:TagCheck Documentation`;
const DOCS_FALLBACK_LABEL = $localize`:@@seo.docs.fallbackLabel:Documentation`;

type SeoKey = 'landing' | 'about' | 'objectives' | 'app' | 'documentation';

interface RouteSeoConfig {
  readonly logicalPath: string;
  readonly title: string;
  readonly description: string;
}

const DOC_LABELS = DOCUMENTATION_PAGES.reduce<Record<string, string>>(
  (labels, page) => {
    labels[page.slug] = page.label;
    return labels;
  },
  {}
);

const ROUTE_SEO_COPY: Record<
  Exclude<SeoKey, 'documentation'>,
  RouteSeoConfig
> = {
  landing: {
    logicalPath: '/',
    title: $localize`:@@seo.landing.title:TagCheck | GTM Validation & Audit Tool for Digital Marketers`,
    description: $localize`:@@seo.landing.description:Validate your GTM setup with TagCheck and keep marketing measurement accurate, reviewable, and easier to hand off.`
  },
  about: {
    logicalPath: '/about',
    title: $localize`:@@seo.about.title:About TagCheck | GTM Validation Workflow`,
    description: $localize`:@@seo.about.description:Learn how TagCheck helps digital teams audit Google Tag Manager setups and reduce measurement errors before launch.`
  },
  objectives: {
    logicalPath: '/objectives',
    title: $localize`:@@seo.objectives.title:TagCheck Objectives | Better Measurement Quality`,
    description: $localize`:@@seo.objectives.description:See the product goals behind TagCheck, from reducing GTM setup risk to improving validation and handoff quality.`
  },
  app: {
    logicalPath: '/app',
    title: $localize`:@@seo.app.title:TagCheck App | GTM Validation Workspace`,
    description: $localize`:@@seo.app.description:Open the interactive TagCheck workspace for GTM validation, report review, and implementation support.`
  }
};

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

  private applyCurrentRouteSeo(): void {
    const seo = this.getRouteSeo();
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

  private getRouteSeo(): RouteSeoConfig {
    const activeRoute = this.getLeafRoute();
    const seoKey =
      (activeRoute.data['seoKey'] as SeoKey | undefined) ?? 'landing';

    if (seoKey === 'documentation') {
      const slug = activeRoute.paramMap.get('name') ?? 'introduction';
      const label = DOC_LABELS[slug] ?? DOCS_FALLBACK_LABEL;

      return {
        logicalPath: `/documentation/${slug}`,
        title: `${label} | ${DOCS_TITLE_SUFFIX}`,
        description: $localize`:@@seo.docs.description:Read the ${label}:docLabel: guide in the TagCheck product documentation for GTM validation, workflows, and implementation details.`
      };
    }

    return ROUTE_SEO_COPY[seoKey];
  }

  private getLeafRoute(): ActivatedRoute['snapshot'] {
    let activeRoute = this.route.snapshot;

    while (activeRoute.firstChild) {
      activeRoute = activeRoute.firstChild;
    }

    return activeRoute;
  }

  private updateMeta(
    seo: RouteSeoConfig,
    canonicalUrl: string,
    robots: string
  ): void {
    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ name: 'keywords', content: KEYWORDS });
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
    this.meta.updateTag({
      property: 'og:locale',
      content: this.locale.hreflang
    });
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
      '@type': 'SoftwareApplication',
      name: 'TagCheck',
      url: canonicalUrl,
      description: seo.description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      inLanguage: this.locale.hreflang,
      image: OG_IMAGE_URL
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
