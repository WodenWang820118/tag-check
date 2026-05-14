import { computed, Injectable, signal } from '@angular/core';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  type PublicDestination,
  searchPublicDestinations
} from '../destination/destination-catalog';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly searchQuery = signal('');
  private readonly searchResults = computed<PublicDestination[]>(() =>
    searchPublicDestinations(this.searchQuery())
  );

  readonly searchResults$ = computed(() => this.searchResults());
  readonly searchQuery$ = computed(() => this.searchQuery());

  constructor(private readonly analyticsService: AnalyticsService) {}

  search(query: string): void {
    const normalizedQuery = query.trim();
    this.searchQuery.set(normalizedQuery);

    if (normalizedQuery) {
      this.analyticsService.trackEvent('search', normalizedQuery);
    }
  }

  resetSearch(): void {
    this.searchQuery.set('');
  }
}
