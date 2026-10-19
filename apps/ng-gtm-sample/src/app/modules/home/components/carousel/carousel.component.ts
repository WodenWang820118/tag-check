import { DomSanitizer } from '@angular/platform-browser';
import {
  Component,
  ChangeDetectionStrategy,
  effect,
  untracked,
  viewChild
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideStar } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCarousel, HlmCarouselImports } from '@spartan-ng/helm/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { DestinationService } from '../../../../shared/services/destination/destination.service';
import { UtilsService } from '../../../../shared/services/utils/utils.service';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import {
  PublicDestination,
  publicDestinations
} from '../../../../shared/services/destination/destination-catalog';

@Component({
  standalone: true,
  selector: 'app-carousel',
  imports: [HlmCarouselImports, HlmButton, NgIcon],
  providers: [provideIcons({ lucideArrowRight, lucideStar })],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="sample-panel overflow-hidden px-4 py-5 sm:px-6">
      <hlm-carousel
        class="mx-auto block w-full px-0 sm:px-12"
        [plugins]="plugins"
        (keydown)="stopAutoplay()"
        (pointerdown)="stopAutoplay()"
      >
        <hlm-carousel-content>
          @for (destination of destinations; track destination.id) {
            <hlm-carousel-item>
              <div
                class="grid cursor-pointer gap-6 px-2 py-3 lg:grid-cols-[1.25fr_0.85fr] lg:items-center"
                role="button"
                tabindex="0"
                [attr.data-testid]="'promotion-' + destination.id"
                (click)="activateDestination(destination)"
                (keydown.enter)="activateDestination(destination, $event)"
                (keydown.space)="activateDestination(destination, $event)"
              >
                <div class="relative overflow-hidden rounded-[1.75rem]">
                  <img
                    [src]="destination.imageBig"
                    class="h-[18rem] w-full object-cover md:h-[24rem]"
                    [alt]="destination.title"
                  />
                  <div
                    class="sample-credit absolute right-3 bottom-3 left-3 rounded-xl bg-slate-950/78 px-3 py-2 text-white"
                    (click)="preventDefault($event)"
                    [innerHTML]="
                      authorInforByPassed(destination.imageBigAuthorInfo)
                    "
                  ></div>
                </div>
                <div class="flex flex-col gap-4 px-2 lg:px-0">
                  <span class="sample-eyebrow">
                    <ng-icon name="lucideStar" class="fill-current text-sm" />
                    Featured Destination
                  </span>
                  <div>
                    <h2 class="sample-page-title text-[2.5rem] text-slate-950">
                      {{ destination.title }}
                    </h2>
                    <p class="sample-copy mt-3 max-w-xl text-base">
                      {{
                        utilsService.truncateText(destination.description, 180)
                      }}
                    </p>
                  </div>
                  <div class="flex flex-wrap items-center gap-3">
                    <button
                      hlmBtn
                      type="button"
                      [attr.data-testid]="'promotion-explore-' + destination.id"
                      (click)="activateDestination(destination, $event)"
                    >
                      <ng-icon name="lucideArrowRight" />
                      Explore Details
                    </button>
                    <span
                      class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600"
                    >
                      Starting from {{ '$' + destination.price }}
                    </span>
                  </div>
                </div>
              </div>
            </hlm-carousel-item>
          }
        </hlm-carousel-content>
        <button
          hlm-carousel-previous
          class="start-1 hidden sm:inline-flex"
          data-testid="promotion-previous"
          (pointerdown)="stopAutoplay()"
        ></button>
        <button
          hlm-carousel-next
          class="end-1 hidden sm:inline-flex"
          data-testid="promotion-next"
          (pointerdown)="stopAutoplay()"
        ></button>
      </hlm-carousel>
      <div class="mt-4 flex justify-center gap-2">
        @for (
          destination of destinations;
          track destination.id;
          let i = $index
        ) {
          <button
            type="button"
            class="h-1.5 w-8 rounded-full transition-colors"
            [class]="
              carousel().currentSlide() === i
                ? 'bg-emerald-500'
                : 'bg-slate-200 hover:bg-slate-300'
            "
            [attr.aria-label]="'Show ' + destination.title"
            [attr.aria-current]="carousel().currentSlide() === i"
            [attr.data-testid]="'promotion-dot-' + destination.id"
            (click)="showSlide(i)"
          ></button>
        }
      </div>
    </div>
  `
})
export class CarouselComponent {
  destinations = publicDestinations;
  protected readonly carousel = viewChild.required(HlmCarousel);
  /** Stops for good on the first interaction, like the previous carousel. */
  private readonly autoplay = Autoplay({
    delay: 3000,
    stopOnInteraction: true
  });
  protected readonly plugins = [this.autoplay];

  constructor(
    private readonly destinationService: DestinationService,
    public readonly utilsService: UtilsService,
    private readonly analyticsService: AnalyticsService,
    private readonly navigationService: NavigationService,
    private readonly sanitizer: DomSanitizer
  ) {
    // view_promotion fires for the first slide and for every slide the user
    // brings into view; slides that autoplay reaches are not tracked.
    let trackedFirstSlide = false;
    effect(() => {
      const index = this.carousel().currentSlide();
      untracked(() => {
        if (trackedFirstSlide && this.isAutoplaying()) {
          return;
        }
        trackedFirstSlide = true;
        this.analyticsService.trackEvent(
          'view_promotion',
          this.destinations[index]
        );
      });
    });
  }

  showSlide(index: number): void {
    this.stopAutoplay();
    this.carousel().scrollTo(index);
  }

  stopAutoplay(): void {
    if (this.isAutoplaying()) {
      this.autoplay.stop();
    }
  }

  goToDetails(destination: PublicDestination): void {
    this.destinationService.changeDestination(destination);
    this.navigationService.navigateToDetail(destination.slug);
  }

  activateDestination(destination: PublicDestination, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.selectPromotion(destination);
    this.goToDetails(destination);
  }

  selectPromotion(destination: PublicDestination): void {
    this.analyticsService.trackEvent('select_promotion', destination);
  }

  preventDefault(event: Event): void {
    event.stopPropagation();
  }

  authorInforByPassed(info: string) {
    return this.sanitizer.bypassSecurityTrustHtml(info);
  }

  /** The plugin has no API before embla initialises it (and none on the server). */
  private isAutoplaying(): boolean {
    try {
      return this.autoplay.isPlaying();
    } catch {
      return false;
    }
  }
}
