import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './seo/seo.service';
import { UrlTrackerService } from './shared/services/url-tracker/url-tracker.service';
import { LoadingService } from './shared/services/loading/loading.service';
import { ConsentService } from './shared/services/consent/consent.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<div class="sample-page"><router-outlet></router-outlet></div>`
})
export class AppComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly seoService = inject(SeoService);
  private readonly urlTrackerService = inject(UrlTrackerService);
  private readonly loadingService = inject(LoadingService);
  private readonly consentService = inject(ConsentService);

  constructor() {
    this.seoService.start();

    const loading = this.loadingService.getLoadingState();
    let didFire = false;
    effect(() => {
      if (this.browser && !loading() && !didFire) {
        didFire = true;
        this.getDataLayer().push({
          event: 'componentsLoaded'
        });
      }
    });

    if (this.browser) {
      this.urlTrackerService.initializeUrlTracking();
    }
  }

  private getDataLayer(): Array<Record<string, unknown>> {
    const scope = globalThis as unknown as {
      dataLayer?: Array<Record<string, unknown>>;
    };
    scope.dataLayer ??= [];
    return scope.dataLayer;
  }
}
