import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { AnalyticsService } from '../analytics/analytics.service';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UrlTrackerService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private initialized = false;

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly router: Router
  ) {}

  initializeUrlTracking(): void {
    if (!this.browser || this.initialized) {
      return;
    }

    this.initialized = true;
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((e: RouterEvent) => {
        if (e.url.includes('/destinations')) {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Destinations',
            page_location: this.getPageLocation()
          });
        } else if (e.url.includes('/thankyou')) {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Thank You',
            page_location: this.getPageLocation()
          });
        } else if (e.url.includes('/details')) {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Destination Detail',
            page_location: this.getPageLocation()
          });
        } else if (e.url.includes('/basket')) {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Basket',
            page_location: this.getPageLocation()
          });
        } else if (e.url.includes('/login')) {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Login',
            page_location: this.getPageLocation()
          });
        } else if (e.url.includes('/checkout')) {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Checkout',
            page_location: this.getPageLocation()
          });
        } else {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Home',
            page_location: this.getPageLocation()
          });
        }
      });
  }

  private getPageLocation(): string {
    return this.browser ? globalThis.location.href : this.router.url;
  }
}
