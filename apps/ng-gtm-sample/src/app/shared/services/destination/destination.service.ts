import { computed, effect, Injectable, signal } from '@angular/core';
import { Destination } from '../../models/destination.model';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable({
  providedIn: 'root',
})
export class DestinationService {
  private readonly destinationSource = signal<Destination>({
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
    price: 0,
  });

  readonly destinationSource$ = computed(() => this.destinationSource());

  constructor(private readonly analyticsService: AnalyticsService) {
    effect(() => {
      if (localStorage.getItem('destination')) {
        this.destinationSource.set(
          JSON.parse(localStorage.getItem('destination') || '[]')
        );
      }
    });
  }

  changeDestination(destination: any): void {
    this.destinationSource.set(destination);
    localStorage.setItem('destination', JSON.stringify(destination));
    this.analyticsService.trackEvent('view_item', destination);
    this.trackSelectItem(destination);
  }

  trackSelectItem(destination: any): void {
    this.analyticsService.trackEvent('select_item', destination);
  }
}
