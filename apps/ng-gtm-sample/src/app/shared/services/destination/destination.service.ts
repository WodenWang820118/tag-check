import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Destination } from '../../models/destination.model';
import { AnalyticsService } from '../analytics/analytics.service';

const DESTINATION_STORAGE_KEY = 'destination';

@Injectable({
  providedIn: 'root'
})
export class DestinationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly destinationSource = signal<Destination | null>(
    this.getStoredDestination()
  );

  readonly destinationSource$ = computed(() => this.destinationSource());

  constructor(private readonly analyticsService: AnalyticsService) {}

  changeDestination(
    destination: Destination,
    options: { persist?: boolean; trackViewItem?: boolean } = {}
  ): void {
    const { persist = true, trackViewItem = true } = options;

    this.destinationSource.set(destination);

    if (persist && this.isBrowser) {
      localStorage.setItem(
        DESTINATION_STORAGE_KEY,
        JSON.stringify(destination)
      );
    }

    if (trackViewItem) {
      this.analyticsService.trackEvent('view_item', destination);
    }
  }

  trackSelectItem(destination: Destination): void {
    this.analyticsService.trackEvent('select_item', destination);
  }

  private getStoredDestination(): Destination | null {
    if (!this.isBrowser) {
      return null;
    }

    const storedDestination = localStorage.getItem(DESTINATION_STORAGE_KEY);
    if (!storedDestination) {
      return null;
    }

    try {
      return JSON.parse(storedDestination) as Destination;
    } catch {
      return null;
    }
  }
}
