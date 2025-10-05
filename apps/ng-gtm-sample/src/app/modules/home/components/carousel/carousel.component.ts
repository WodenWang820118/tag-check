import { DomSanitizer } from '@angular/platform-browser';
import { AfterViewInit, Component } from '@angular/core';
import { DestinationService } from '../../../../shared/services/destination/destination.service';
import { UtilsService } from '../../../../shared/services/utils/utils.service';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { destinations } from '../../../../shared/services/destination/destinations';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'app-carousel',
  imports: [CarouselModule, ButtonModule],
  template: `
    <div class="container mx-auto px-6 border border-gray-300 rounded-lg p-4">
      <p-carousel
        [value]="destinations"
        [numVisible]="3"
        [numScroll]="3"
        [circular]="false"
        [responsiveOptions]="responsiveOptions"
        autoplayInterval="3000"
        (page)="onSlideChanged($event)"
        class="w-full"
      >
        <ng-template pTemplate="item" let-destination>
          <div
            class="flex flex-col items-center cursor-pointer transition-shadow hover:shadow-lg border border-surface rounded-border m-2 p-4"
            (click)="selectPromotion(destination); goToDetails(destination)"
          >
            <div class="relative w-full h-48 md:h-56 mb-4">
              <img
                [src]="destination.imageBig"
                class="w-full h-full object-cover rounded"
                alt=""
              />
              <div
                class="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs p-1 rounded max-w-xs break-words"
                (click)="preventDefault($event)"
                [innerHTML]="
                  authorInforByPassed(destination.imageBigAuthorInfo)
                "
              ></div>
            </div>
            <div class="text-lg font-medium text-center w-full text-gray-800">
              {{ destination.title }}
            </div>
          </div>
        </ng-template>
      </p-carousel>
    </div>
  `,
})
export class CarouselComponent implements AfterViewInit {
  destinations = destinations;
  responsiveOptions = [
    { breakpoint: '1024px', numVisible: 3, numScroll: 3 },
    { breakpoint: '768px', numVisible: 2, numScroll: 2 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 },
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

  goToDetails(destination: any): void {
    this.destinationService.changeDestination(destination);
    this.navigationService.navigateToDetail(destination.id);
  }

  selectPromotion(destination: any): void {
    console.log('selectPromotion', destination);
    this.analyticsService.trackEvent('select_promotion', destination);
  }

  preventDefault(event: any): void {
    event.stopPropagation();
  }

  authorInforByPassed(info: string) {
    return this.sanitizer.bypassSecurityTrustHtml(info);
  }
}
