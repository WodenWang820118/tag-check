import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  getPublicDestinationBySlug,
  type PublicDestination
} from '../shared/services/destination/destination-catalog';

type SeoKey =
  | 'home'
  | 'destinations'
  | 'destination-detail'
  | 'login'
  | 'transaction'
  | 'admin'
  | 'not-found';

interface RouteSeoConfig {
  readonly logicalPath: string;
  readonly title: string;
  readonly description: string;
  readonly robots: string;
  readonly image?: string;
}

const DEFAULT_OG_IMAGE = `${environment.seo.siteOrigin}/assets/logo.png`;

const ROUTE_SEO_COPY: Record<
  Exclude<SeoKey, 'destination-detail'>,
  RouteSeoConfig
> = {
  home: {
    logicalPath: '/home',
    title: 'Travel With GTM | Demo Travel Catalog',
    description:
      'Browse the ng-gtm-sample travel catalog and inspect a prerendered demo experience with indexable destination pages.',
    robots: 'index,follow'
  },
  destinations: {
    logicalPath: '/product/destinations',
    title: 'Destinations | Travel With GTM',
    description:
      'Explore the public travel destination catalog with destination highlights, pricing, and direct entry detail pages.',
    robots: 'index,follow'
  },
  login: {
    logicalPath: '/home/login',
    title: 'Login | Travel With GTM',
    description: 'Sign in to the private ng-gtm-sample demo workspace.',
    robots: 'noindex,nofollow'
  },
  transaction: {
    logicalPath: '/transaction',
    title: 'Checkout Flow | Travel With GTM',
    description:
      'Private transaction flow for the ng-gtm-sample demo application.',
    robots: 'noindex,nofollow'
  },
  admin: {
    logicalPath: '/admin',
    title: 'Admin | Travel With GTM',
    description: 'Private admin workflow for the ng-gtm-sample demo.',
    robots: 'noindex,nofollow'
  },
  'not-found': {
    logicalPath: '/404',
    title: 'Page Not Found | Travel With GTM',
    description:
      'The requested page could not be found in the ng-gtm-sample demo.',
    robots: 'noindex,follow'
  }
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
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
    const robots = environment.seo.allowIndexing
      ? seo.robots
      : 'noindex,nofollow';
    const ogImage = this.normalizeSeoImageUrl(seo.image ?? DEFAULT_OG_IMAGE);

    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ property: 'og:title', content: seo.title });
    this.meta.updateTag({
      property: 'og:description',
      content: seo.description
    });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });
    this.meta.updateTag({ name: 'twitter:title', content: seo.title });
    this.meta.updateTag({
      name: 'twitter:description',
      content: seo.description
    });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });
    this.updateCanonical(canonicalUrl);
  }

  private getRouteSeo(): RouteSeoConfig {
    const activeRoute = this.getLeafRoute();
    const seoKey = (activeRoute.data['seoKey'] as SeoKey | undefined) ?? 'home';

    if (seoKey === 'destination-detail') {
      return this.getDestinationDetailSeo(activeRoute.paramMap.get('slug'));
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

  private getDestinationDetailSeo(slug: string | null): RouteSeoConfig {
    const destination = slug ? getPublicDestinationBySlug(slug) : undefined;

    if (!destination) {
      return ROUTE_SEO_COPY['not-found'];
    }

    return {
      logicalPath: `/product/details/${destination.slug}`,
      title: `${destination.title} | Travel With GTM`,
      description: this.buildDestinationDescription(destination),
      robots: 'index,follow',
      image: destination.imageBig || destination.image1 || DEFAULT_OG_IMAGE
    };
  }

  private buildDestinationDescription(destination: PublicDestination): string {
    const description = destination.description?.trim();

    if (description) {
      return description;
    }

    const location = [destination.city, destination.country]
      .filter(Boolean)
      .join(', ');

    return location
      ? `Discover ${destination.title} in ${location} with the ng-gtm-sample travel catalog.`
      : `Discover ${destination.title} with the ng-gtm-sample travel catalog.`;
  }

  private updateCanonical(canonicalUrl: string): void {
    const existing = this.document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );
    const link = existing ?? this.document.createElement('link');

    link.rel = 'canonical';
    link.href = canonicalUrl;

    if (!existing) {
      this.document.head.appendChild(link);
    }
  }

  private buildAbsoluteUrl(logicalPath: string): string {
    return `${environment.seo.siteOrigin}${logicalPath}`;
  }

  private normalizeSeoImageUrl(imagePath: string): string {
    if (/^https?:\/\//.test(imagePath)) {
      return imagePath;
    }

    const normalizedPath = imagePath.replace(/^\.\//, '');
    const relativePath = normalizedPath.startsWith('/')
      ? normalizedPath
      : `/${normalizedPath}`;

    return this.buildAbsoluteUrl(relativePath);
  }
}
