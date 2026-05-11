import { Injectable } from '@angular/core';
import { AnalyticsService } from '../analytics/analytics.service';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UrlTrackerService {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly router: Router
  ) {}

  initializeUrlTracking(): void {
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
            page_location: globalThis.location.href
          });
        } else if (e.url.includes('/thankyou')) {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Thank You',
            page_location: globalThis.location.href
          });
        } else if (e.url.includes('/detail')) {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Detail',
            page_location: globalThis.location.href
          });
        } else if (e.url.includes('/basket')) {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Basket',
            page_location: globalThis.location.href
          });
        } else if (e.url.includes('/login')) {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Login',
            page_location: globalThis.location.href
          });
        } else if (e.url.includes('/checkout')) {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Checkout',
            page_location: globalThis.location.href
          });
        } else {
          this.analyticsService.trackEvent('page_view', {
            page_path: e.url,
            page_title: 'Home',
            page_location: globalThis.location.href
          });
        }
      });
  }
}
