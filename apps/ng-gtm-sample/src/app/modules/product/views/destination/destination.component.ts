import {
  Component,
  computed,
  effect,
  OnInit,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { take, tap } from 'rxjs';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { WindowSizeService } from '../../../../shared/services/window-size/window-size.service';
import { UtilsService } from '../../../../shared/services/utils/utils.service';
import { DestinationService } from '../../../../shared/services/destination/destination.service';
import { SearchService } from '../../../../shared/services/search/search.service';
import { YoutubeService } from '../../../../shared/services/youtube/youtube.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FirestoreDestinationPipelineService } from '../../../../shared/services/firestore-destination-pipeline/firestore-destination-pipeline.service';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { Destination } from '../../../../shared/models/destination.model';
import { DialogModule } from 'primeng/dialog';

@Component({
  standalone: true,
  selector: 'app-destination',
  imports: [
    YouTubePlayerModule,
    ReactiveFormsModule,
    FormsModule,
    DialogModule,
  ],
  templateUrl: './destination.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class DestinationComponent implements OnInit {
  searchForm: FormGroup = new FormGroup({
    searchTerm: new FormControl(''),
  });

  private readonly destinations = signal<Destination[]>([]);
  destinations$ = computed(() => this.destinations());

  private readonly videoId = signal<string>('');
  videoId$ = computed(() => this.videoId());

  private readonly showVideoPlayer = signal<boolean>(false);
  showVideoPlayer$ = computed(() => this.showVideoPlayer);
  // Getter and setter for PrimeNG dialog two-way binding
  get videoDialogVisible(): boolean {
    return this.showVideoPlayer();
  }
  set videoDialogVisible(value: boolean) {
    this.showVideoPlayer.set(value);
  }

  private readonly videoPlayer = viewChild<any>('player');
  playerVars = {
    enablejsapi: 1,
  };

  constructor(
    private readonly destinationService: DestinationService,
    public readonly utilsService: UtilsService,
    public readonly windowSizeService: WindowSizeService,
    private readonly navigationService: NavigationService,
    public readonly searchService: SearchService,
    private readonly youtubeService: YoutubeService,
    private readonly sanitizer: DomSanitizer,
    private readonly firestoreDestinationPipelineService: FirestoreDestinationPipelineService,
    private readonly analyticsService: AnalyticsService
  ) {
    effect(() => {
      const searchResults = this.searchService.searchResults$();
      if (searchResults.length) {
        this.destinations.set(searchResults);
      }
    });
  }

  ngOnInit() {
    this.firestoreDestinationPipelineService
      .getFirstDestinationsData()
      .pipe(
        take(1),
        tap((destinations) => {
          this.destinations.set(destinations);
          this.trackViewItemList(destinations);
        })
      )
      .subscribe();
  }

  getNextDestinations() {
    this.firestoreDestinationPipelineService
      .getNextDestinationsData()
      .pipe(
        take(1),
        tap((destinations) => {
          this.destinations.set(destinations);
          this.trackViewItemList(destinations);
        })
      )
      .subscribe();
  }

  getPreviousDestinations() {
    if (this.isPreviousDisabled()) return;
    this.firestoreDestinationPipelineService
      .getPreviousDestinationsData()
      .pipe(
        take(1),
        tap((destinations) => {
          this.destinations.set(destinations);
          this.trackViewItemList(destinations);
        })
      )
      .subscribe();
  }

  trackViewItemList(destinations: Destination[]) {
    this.analyticsService.trackEvent('view_item_list', {
      ecommerce: {
        items: destinations.map((destination) => ({
          item_id: destination.id,
          item_name: destination.title,
          item_category: destination.title,
          price: destination.price,
          quantity: 1,
        })),
      },
    });
  }

  isPreviousDisabled() {
    return (
      this.firestoreDestinationPipelineService.getPreviousDocsStackLength() < 2
    );
  }

  navigateToHome() {
    this.navigationService.navigateToHome();
  }

  goToDetails(destination: any): void {
    this.destinationService.changeDestination(destination);
    this.navigationService.navigateToDetail(destination.id);
  }

  selectItem(destination: any): void {
    this.destinationService.trackSelectItem(destination);
  }

  navigateToSearchResults(query: string): void {
    this.searchService.search(query);
    this.navigationService.navigateToDestinationResults(query);
  }

  onSubmit(f: FormGroup): void {
    const query = f.value.searchTerm;
    this.navigateToSearchResults(query);
  }

  getVideoId(url: string): string {
    return url.split('/')[url.split('/').length - 1];
  }

  closeModal() {
    this.showVideoPlayer.set(false);
    this.videoPlayer().pauseVideo();
    this.youtubeService.stopProgressTracking();
  }

  showModal(url: string) {
    this.videoId.set(this.getVideoId(url));
    this.showVideoPlayer.set(true);
  }

  onStateChange(event: any) {
    this.youtubeService.trackVideoEvent(event);
  }

  authorInforByPassed(info: string) {
    return this.sanitizer.bypassSecurityTrustHtml(info);
  }
}
