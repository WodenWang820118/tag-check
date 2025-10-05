import { computed, Injectable, signal } from '@angular/core';
import { take, tap } from 'rxjs';
import { AnalyticsService } from '../analytics/analytics.service';
import { FirestoreDestinationPipelineService } from '../firestore-destination-pipeline/firestore-destination-pipeline.service';
import { Destination } from '../../models/destination.model';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly searchResults = signal<Destination[]>([]);
  readonly searchResults$ = computed(() => this.searchResults());

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly firestoreDestinationPipelineService: FirestoreDestinationPipelineService
  ) {}

  search(query: string): void {
    switch (query) {
      case '':
        this.firestoreDestinationPipelineService
          .getPreviousDestinationsData()
          .pipe(
            take(1),
            tap((data) => {
              this.searchResults.set(data);
            })
          )
          .subscribe();
        break;

      case 'all':
        this.firestoreDestinationPipelineService
          .getAllDestinationsData()
          .pipe(
            take(1),
            tap((data) => {
              this.searchResults.set(data);
            })
          )
          .subscribe();
        this.analyticsService.trackEvent('search', query);
        break;

      default:
        this.firestoreDestinationPipelineService
          .getSearchResultsData(query, 10)
          .subscribe((destinations: Destination[]) => {
            this.analyticsService.trackEvent('search', query);
            this.searchResults.set(destinations);
          });
        break;
    }
  }

  resetSearch(): void {
    this.firestoreDestinationPipelineService
      .getPreviousDestinationsData()
      .pipe(
        take(1),
        tap((data) => {
          this.searchResults.set(data);
        })
      )
      .subscribe();
  }
}
