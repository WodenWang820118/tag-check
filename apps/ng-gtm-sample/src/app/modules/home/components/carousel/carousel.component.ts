import { DomSanitizer } from '@angular/platform-browser';
import { AfterViewInit, Component } from '@angular/core';
import { DestinationService } from '../../../../shared/services/destination/destination.service';
import { UtilsService } from '../../../../shared/services/utils/utils.service';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import {
  PublicDestination,
  publicDestinations
} from '../../../../shared/services/destination/destination-catalog';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'app-carousel',
  imports: [CarouselModule, ButtonModule],
  template: `
    <div class="sample-panel overflow-hidden px-4 py-5 sm:px-6">
      <p-carousel
        [value]="destinations"
        [numVisible]="1"
        [numScroll]="1"
        [circular]="false"
        [responsiveOptions]="responsiveOptions"
        autoplayInterval="3000"
        (page)="onSlideChanged($event)"
        class="w-full"
      >
        <ng-template pTemplate="item" let-destination>
          <div
            class="grid gap-6 px-2 py-3 lg:grid-cols-[1.25fr_0.85fr] lg:items-center"
            role="button"
            tabindex="0"
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
                class="sample-credit absolute bottom-3 left-3 right-3 rounded-xl bg-slate-950/78 px-3 py-2 text-white"
                (click)="preventDefault($event)"
                [innerHTML]="
                  authorInforByPassed(destination.imageBigAuthorInfo)
                "
              ></div>
            </div>
            <div class="flex flex-col gap-4 px-2 lg:px-0">
              <span class="sample-eyebrow">
                <i class="pi pi-star-fill text-sm"></i>
                Featured Destination
              </span>
              <div>
                <h2 class="sample-page-title text-[2.5rem] text-slate-950">
                  {{ destination.title }}
                </h2>
                <p class="sample-copy mt-3 max-w-xl text-base">
                  {{ utilsService.truncateText(destination.description, 180) }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <button
                  pButton
                  type="button"
                  label="Explore Details"
                  icon="pi pi-arrow-right"
                  (click)="activateDestination(destination, $event)"
                ></button>
                <span
                  class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Starting from {{ '$' + destination.price }}
                </span>
              </div>
            </div>
          </div>
        </ng-template>
      </p-carousel>
    </div>
  `
})
export class CarouselComponent implements AfterViewInit {
  destinations = publicDestinations;
  responsiveOptions = [
    { breakpoint: '1024px', numVisible: 1, numScroll: 1 },
    { breakpoint: '768px', numVisible: 1, numScroll: 1 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 }
  ];
  activeSlideIndex = 0;

  constructor(
    private readonly destinationService: DestinationService,
    public readonly utilsService: UtilsService,
    private readonly analyticsService: AnalyticsService,
    private readonly navigationService: NavigationService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngAfterViewInit(): void {
    // track the first promotion
    this.analyticsService.trackEvent(
      'view_promotion',
      this.destinations[this.activeSlideIndex]
    );
  }

  onSlideChanged(event: any): void {
    this.activeSlideIndex = event.page;
    this.analyticsService.trackEvent(
      'view_promotion',
      this.destinations[this.activeSlideIndex]
    );
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
}
