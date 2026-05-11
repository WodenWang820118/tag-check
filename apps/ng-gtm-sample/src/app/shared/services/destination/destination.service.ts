import { computed, Injectable, signal } from '@angular/core';
import { Destination } from '../../models/destination.model';
import { AnalyticsService } from '../analytics/analytics.service';

const EMPTY_DESTINATION: Destination = {
  id: '',
  country: '',
  city: '',
  description: '',
  latitude: 0,
  longitude: 0,
  title: '',
  smallTitle: '',
  image1: '',
  image1AuthorInfo: '',
  image2: '',
  image2AuthorInfo: '',
  image3: '',
  image3AuthorInfo: '',
  imageBig: '',
  imageBigAuthorInfo: '',
  video: '',
  price: 0
};

@Injectable({
  providedIn: 'root'
})
export class DestinationService {
  private readonly destinationSource = signal<Destination>(
    this.getStoredDestination()
  );

  readonly destinationSource$ = computed(() => this.destinationSource());

  constructor(private readonly analyticsService: AnalyticsService) {}

  changeDestination(destination: any): void {
    this.destinationSource.set(destination);
    localStorage.setItem('destination', JSON.stringify(destination));
    this.analyticsService.trackEvent('view_item', destination);
    this.trackSelectItem(destination);
  }

  trackSelectItem(destination: any): void {
    this.analyticsService.trackEvent('select_item', destination);
  }

  private getStoredDestination(): Destination {
    const storedDestination = localStorage.getItem('destination');
    if (!storedDestination) {
      return EMPTY_DESTINATION;
    }

    try {
      return JSON.parse(storedDestination) as Destination;
    } catch {
      return EMPTY_DESTINATION;
    }
  }
}
