import {
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { DomSanitizer } from '@angular/platform-browser';
import { YouTubePlayer, YouTubePlayerModule } from '@angular/youtube-player';
import { ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideInfo,
  lucideMapPin,
  lucidePlay,
  lucideSearch
} from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { WindowSizeService } from '../../../../shared/services/window-size/window-size.service';
import { UtilsService } from '../../../../shared/services/utils/utils.service';
import { DestinationService } from '../../../../shared/services/destination/destination.service';
import { SearchService } from '../../../../shared/services/search/search.service';
import {
  YoutubeService,
  YoutubeStateChangeEvent
} from '../../../../shared/services/youtube/youtube.service';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import {
  getPublicDestinationPage,
  PublicDestination
} from '../../../../shared/services/destination/destination-catalog';

export interface SearchFormModel {
  searchTerm: string;
}

@Component({
  standalone: true,
  selector: 'app-destination',
  imports: [
    YouTubePlayerModule,
    FormField,
    HlmAlertImports,
    HlmButton,
    HlmDialogImports,
    HlmInput,
    NgIcon
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideArrowRight,
      lucideInfo,
      lucideMapPin,
      lucidePlay,
      lucideSearch
    })
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './destination.component.html'
})
export class DestinationComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly queryParamMap = toSignal(this.activatedRoute.queryParamMap, {
    initialValue: this.activatedRoute.snapshot.queryParamMap
  });

  readonly searchModel = linkedSignal<SearchFormModel>(() => ({
    searchTerm: this.queryParamMap()?.get('search_term') ?? ''
  }));

  readonly searchForm = form(this.searchModel);

  private readonly pageIndex = signal(0);
  private readonly filteredDestinations = computed(() =>
    this.searchService.searchResults$()
  );
  private readonly currentPage = computed(() =>
    getPublicDestinationPage(this.pageIndex(), this.filteredDestinations())
  );
  readonly destinations$ = computed(() => this.currentPage().items);
  readonly hasNextPage$ = computed(() => this.currentPage().hasNext);

  private readonly videoId = signal('');
  readonly videoId$ = computed(() => this.videoId());

  private readonly showVideoPlayer = signal(false);
  readonly playerVars = {
    enablejsapi: 1
  };

  private readonly videoPlayer = viewChild<YouTubePlayer>('player');

  constructor(
    private readonly destinationService: DestinationService,
    public readonly utilsService: UtilsService,
    public readonly windowSizeService: WindowSizeService,
    private readonly navigationService: NavigationService,
    public readonly searchService: SearchService,
    private readonly youtubeService: YoutubeService,
    private readonly sanitizer: DomSanitizer,
    private readonly analyticsService: AnalyticsService
  ) {
    effect(() => {
      const visibleDestinations = this.destinations$();
      if (visibleDestinations.length === 0) {
        return;
      }

      this.trackViewItemList(visibleDestinations);
    });

    effect(() => {
      const params = this.queryParamMap();
      if (!params) {
        return;
      }
      const searchTerm = params.get('search_term') ?? '';
      this.pageIndex.set(0);

      if (searchTerm) {
        this.searchService.search(searchTerm);
        return;
      }

      this.searchService.resetSearch();
    });
  }

  get videoDialogVisible(): boolean {
    return this.showVideoPlayer();
  }

  set videoDialogVisible(value: boolean) {
    this.showVideoPlayer.set(value);
  }

  getNextDestinations() {
    if (!this.hasNextPage$()) {
      return;
    }

    this.pageIndex.update((currentPageIndex) => currentPageIndex + 1);
  }

  getPreviousDestinations() {
    if (this.isPreviousDisabled()) {
      return;
    }

    this.pageIndex.update((currentPageIndex) => currentPageIndex - 1);
  }

  trackViewItemList(destinations: PublicDestination[]) {
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

  isPreviousDisabled() {
    return this.pageIndex() === 0;
  }

  isNextDisabled() {
    return !this.hasNextPage$();
  }

  goToDetails(destination: PublicDestination): void {
    this.destinationService.changeDestination(destination);
    this.navigationService.navigateToDetail(destination.slug);
  }

  selectItem(destination: PublicDestination): void {
    this.destinationService.trackSelectItem(destination);
  }

  navigateToSearchResults(query: string): void {
    this.pageIndex.set(0);
    this.searchService.search(query);
    this.navigationService.navigateToDestinationResults(query);
  }

  onSubmit(): void {
    const query = this.searchForm.searchTerm().value() ?? '';
    this.navigateToSearchResults(query);
  }

  getVideoId(url: string): string {
    return url.split('/')[url.split('/').length - 1];
  }

  closeModal() {
    this.showVideoPlayer.set(false);
    this.videoPlayer()?.pauseVideo();
    this.youtubeService.stopProgressTracking();
  }

  showModal(url: string) {
    if (!url) {
      return;
    }

    this.videoId.set(this.getVideoId(url));
    this.showVideoPlayer.set(true);
  }

  onStateChange(event: YoutubeStateChangeEvent) {
    this.youtubeService.trackVideoEvent(event);
  }

  getImageSrc(imageName: string | undefined) {
    return imageName || 'assets/images/placeholder.png';
  }

  authorInforByPassed(info: string) {
    return info ? this.sanitizer.bypassSecurityTrustHtml(info) : '';
  }
}
