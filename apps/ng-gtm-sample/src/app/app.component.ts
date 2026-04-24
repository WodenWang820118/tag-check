import { Component, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UrlTrackerService } from './shared/services/url-tracker/url-tracker.service';
import { LoadingService } from './shared/services/loading/loading.service';
// TODO: meta description
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<div class="sample-page"><router-outlet></router-outlet></div>`
})
export class AppComponent {
  constructor(
    private readonly urlTrackerService: UrlTrackerService,
    private readonly loadingService: LoadingService
  ) {
    const loading = this.loadingService.getLoadingState();
    let didFire = false;
    effect(() => {
      if (!loading() && !didFire) {
        didFire = true;
        (globalThis as any).dataLayer.push({ event: 'componentsLoaded' });
      }
    });
    this.urlTrackerService.initializeUrlTracking();
  }
}
