import { Component, computed, OnInit, signal, viewChild } from '@angular/core';
import { CarouselComponent } from '../../components/carousel/carousel.component'; // existing custom carousel
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { CookieConsentComponent } from '../../../../shared/components/cookie-consent/cookie-consent.component';
import { ConsentService } from '../../../../shared/services/consent/consent.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-main',
  imports: [
    CarouselComponent,
    CookieConsentComponent,
    ButtonModule,
    CardModule,
  ],
  template: `
    <div class="container mx-auto px-6">
      <div>
        <app-carousel></app-carousel>
      </div>
      <div id="viewDestination" class="my-6 text-center">
        <button
          pButton
          type="button"
          label="View Destinations"
          (click)="navigateToDestinations()"
        ></button>
      </div>
      @defer (on viewport) {
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch justify-between"
      >
        <div class="h-full">
          <p-card class="h-full">
            <ng-template pTemplate="header">
              <div class="flex items-center space-x-2 p-4 pb-0">
                <i
                  class="pi pi-home text-blue-600 text-2xl"
                  style="font-size: 1.5rem;"
                ></i>
                <h3 class="text-xl font-semibold">Luxurious Accommodations</h3>
              </div>
            </ng-template>
            <p class="p-4 pt-0">
              Nunc ornare turpis eu nisi hendrerit a tempor felis ullamcorper.
              Integer turpis felis, consectetur quis congue tempus, porta vitae
              purus. Mauris condimentum orci et nunc tempor mollis.
            </p>
          </p-card>
        </div>
        <div class="h-full">
          <p-card class="h-full">
            <ng-template pTemplate="header">
              <div class="flex items-center space-x-2 p-4 pb-0">
                <i
                  class="pi pi-globe text-green-600 text-2xl"
                  style="font-size: 1.5rem;"
                ></i>
                <h3 class="text-xl font-semibold">Incredible Locations</h3>
              </div>
            </ng-template>
            <p class="p-4 pt-0">
              Nunc ornare turpis eu nisi hendrerit a tempor felis ullamcorper.
              Integer turpis felis, consectetur quis congue tempus, porta vitae
              purus. Mauris condimentum orci et nunc tempor mollis.
            </p>
          </p-card>
        </div>
        <div class="h-full">
          <p-card class="h-full">
            <ng-template pTemplate="header">
              <div class="flex items-center space-x-2 p-4 pb-0">
                <i
                  class="pi pi-tags text-yellow-600 text-2xl"
                  style="font-size: 1.5rem;"
                ></i>
                <h3 class="text-xl font-semibold">Pricing</h3>
              </div>
            </ng-template>
            <p class="p-4 pt-0">
              Please use our
              <a
                href="https://wodenwang820118.github.io/ng-gtm-integration-sample/?utm_source=ng-gtm-integration-sample&utm_medium=website&utm_campaign=app_download"
                target="_blank"
                >app</a
              >
              for more seamless services. Please use the link in the mobile to
              test the deep link with UTM parameters.
            </p>
          </p-card>
        </div>
      </div>
      } @placeholder {
      <div class="text-center py-10">Loading...</div>
      }
      <app-cookie-consent
        [showModalInput]="showCookieModal$()"
        [showCookieConsentInput]="true"
      ></app-cookie-consent>
    </div>
  `,
})
export class MainComponent implements OnInit {
  private readonly showCookieModal = signal(false);
  readonly showCookieModal$ = computed(() => this.showCookieModal());

  cookieConsentComponent = viewChild(CookieConsentComponent);

  constructor(
    private readonly navigationService: NavigationService,
    private readonly consentService: ConsentService
  ) {}

  ngOnInit(): void {
    // show cookie consent modal if consent has not been confirmed
    this.showCookieModal.set(!this.consentService.getConsentStatus());
  }

  navigateToDestinations() {
    this.navigationService.navigateToDestinations();
  }
}
