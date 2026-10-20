import {
  Component,
  computed,
  OnInit,
  signal,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBadgePercent,
  lucideCalendarCheck,
  lucideCompass,
  lucideCreditCard,
  lucideGlobe,
  lucideHeadset,
  lucideHouse,
  lucideMapPin,
  lucideShieldCheck,
  lucideSmartphone,
  lucideSparkles,
  lucideTags,
  lucideUsers
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCard } from '@spartan-ng/helm/card';
import { CarouselComponent } from '../../components/carousel/carousel.component';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { CookieConsentComponent } from '../../../../shared/components/cookie-consent/cookie-consent.component';
import { ConsentService } from '../../../../shared/services/consent/consent.service';

@Component({
  selector: 'app-main',
  imports: [
    CarouselComponent,
    CookieConsentComponent,
    HlmButton,
    HlmCard,
    NgIcon
  ],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideBadgePercent,
      lucideCalendarCheck,
      lucideCompass,
      lucideCreditCard,
      lucideGlobe,
      lucideHeadset,
      lucideHouse,
      lucideMapPin,
      lucideShieldCheck,
      lucideSmartphone,
      lucideSparkles,
      lucideTags,
      lucideUsers
    })
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="space-y-8">
      <section
        class="sample-panel grid gap-8 overflow-hidden px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-8"
      >
        <div class="flex flex-col justify-center gap-5">
          <span class="sample-eyebrow">
            <ng-icon name="lucideSparkles" class="text-sm" />
            Handpicked trips for every season
          </span>
          <div class="space-y-4">
            <h1 class="sample-page-title max-w-3xl text-slate-950">
              Find your next unforgettable journey.
            </h1>
            <p class="sample-copy max-w-2xl text-lg">
              Explore mountain villages, sunlit coastlines and lively cities.
              Compare trips with the full price up front, choose your travelers,
              and book in a few minutes.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              hlmBtn
              type="button"
              data-testid="browse-destinations"
              (click)="navigateToDestinations()"
            >
              <ng-icon name="lucideArrowRight" />
              Browse Destinations
            </button>
            <a
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700"
              href="https://wodenwang820118.github.io/ng-gtm-sample/?utm_source=ng-gtm-sample&utm_medium=website&utm_campaign=app_download"
              target="_blank"
              rel="noreferrer"
            >
              <ng-icon name="lucideSmartphone" class="text-base" />
              Get the mobile app
            </a>
          </div>
        </div>

        <div class="sample-inset-surface grid content-start gap-3 p-5">
          <div
            class="text-sm font-semibold tracking-[0.22em] text-slate-500 uppercase"
          >
            Why travelers book with us
          </div>
          @for (promise of bookingPromises; track promise.title) {
            <div
              class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <span
                class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-lg text-emerald-700"
              >
                <ng-icon [name]="promise.icon" />
              </span>
              <div>
                <div class="font-semibold text-slate-900">
                  {{ promise.title }}
                </div>
                <div class="text-sm leading-6 text-slate-600">
                  {{ promise.description }}
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <section class="space-y-4">
        <div class="space-y-1">
          <span class="sample-eyebrow">
            <ng-icon name="lucideMapPin" class="text-sm" />
            Featured destinations
          </span>
          <h2 class="sample-section-title text-slate-950">
            This season's favorites
          </h2>
        </div>
        <app-carousel></app-carousel>
      </section>

      <!-- Rendered eagerly: swapping in a deferred block below the carousel
           shifted the page under clicks aimed at the carousel controls. -->
      <section class="grid gap-5 lg:grid-cols-3">
        @for (pillar of featuredPillars; track pillar.title) {
          <section
            hlmCard
            class="h-full gap-0 rounded-[1.5rem] py-0 text-base shadow-sm"
          >
            <div class="flex items-center gap-3 px-6 pt-6">
              <span
                class="grid h-12 w-12 place-items-center rounded-2xl text-xl"
                [class]="pillar.accent"
              >
                <ng-icon [name]="pillar.icon" />
              </span>
              <div class="text-xl font-semibold text-slate-900">
                {{ pillar.title }}
              </div>
            </div>
            <p class="sample-copy px-6 pt-4 pb-6">
              {{ pillar.description }}
            </p>
          </section>
        }
      </section>

      <section class="sample-panel space-y-6 px-6 py-8 lg:px-8">
        <div class="space-y-1">
          <span class="sample-eyebrow">
            <ng-icon name="lucideCompass" class="text-sm" />
            How booking works
          </span>
          <h2 class="sample-section-title text-slate-950">
            From inspiration to confirmation in three steps
          </h2>
        </div>
        <ol class="grid gap-4 md:grid-cols-3">
          @for (step of bookingSteps; track step.title; let i = $index) {
            <li class="sample-inset-surface flex gap-4 p-5">
              <span
                class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 font-semibold text-white"
              >
                {{ i + 1 }}
              </span>
              <div>
                <div
                  class="flex items-center gap-2 font-semibold text-slate-900"
                >
                  <ng-icon [name]="step.icon" />
                  {{ step.title }}
                </div>
                <p class="sample-copy mt-1 text-sm">{{ step.description }}</p>
              </div>
            </li>
          }
        </ol>
      </section>

      <app-cookie-consent
        [showModalInput]="showCookieModal$()"
        [showCookieConsentInput]="true"
      ></app-cookie-consent>
    </div>
  `
})
export class MainComponent implements OnInit {
  readonly featuredPillars = [
    {
      icon: 'lucideHouse',
      accent: 'bg-blue-100 text-blue-700',
      title: 'Luxurious Accommodations',
      description:
        'Stay in hand-selected hotels, chalets and seaside villas, with breakfast and transfers included on most trips.'
    },
    {
      icon: 'lucideGlobe',
      accent: 'bg-emerald-100 text-emerald-700',
      title: 'Incredible Locations',
      description:
        'Discover Swiss valleys, Andalusian plazas and New England harbors, each with a local guide who knows the best spots.'
    },
    {
      icon: 'lucideTags',
      accent: 'bg-amber-100 text-amber-700',
      title: 'Pricing & Promotions',
      description:
        'See the full price per person before you book, and save more with seasonal offers and early-booking deals.'
    }
  ];

  readonly bookingPromises = [
    {
      icon: 'lucideBadgePercent',
      title: 'Transparent prices',
      description: 'The price you see per person is the price you pay.'
    },
    {
      icon: 'lucideCalendarCheck',
      title: 'Flexible plans',
      description: 'Change your travelers before you check out.'
    },
    {
      icon: 'lucideShieldCheck',
      title: 'Secure checkout',
      description: 'Your payment details are encrypted from start to finish.'
    },
    {
      icon: 'lucideHeadset',
      title: 'Help when you need it',
      description:
        'Our travel team answers questions before and during your trip.'
    }
  ];

  readonly bookingSteps = [
    {
      icon: 'lucideMapPin',
      title: 'Choose a destination',
      description: 'Browse featured trips or search the full catalog.'
    },
    {
      icon: 'lucideUsers',
      title: 'Add your travelers',
      description:
        'Pick how many people are coming and add the trip to your cart.'
    },
    {
      icon: 'lucideCreditCard',
      title: 'Check out securely',
      description: 'Enter your details and payment, then get your confirmation.'
    }
  ];

  private readonly showCookieModal = signal(false);
  readonly showCookieModal$ = computed(() => this.showCookieModal());

  cookieConsentComponent = viewChild(CookieConsentComponent);

  constructor(
    private readonly navigationService: NavigationService,
    private readonly consentService: ConsentService
  ) {}

  ngOnInit(): void {
    this.showCookieModal.set(!this.consentService.getConsentStatus());
  }

  navigateToDestinations() {
    this.navigationService.navigateToDestinations();
  }
}
