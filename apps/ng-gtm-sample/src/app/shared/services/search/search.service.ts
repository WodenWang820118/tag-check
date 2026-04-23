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
              this.trackViewItemList(data);
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
              this.trackViewItemList(data);
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
            this.trackViewItemList(destinations);
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
          this.trackViewItemList(data);
        })
      )
      .subscribe();
  }

  private trackViewItemList(destinations: Destination[]): void {
    this.analyticsService.trackEvent('view_item_list', {
      ecommerce: {
        items: destinations.map((destination) => ({
          item_id: destination.id,
          item_name: destination.title,
          item_category: destination.title,
          price: destination.price,
          quantity: 1
        }))
      }
    });
  }
}
