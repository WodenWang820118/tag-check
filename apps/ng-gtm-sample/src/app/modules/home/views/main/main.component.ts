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
  lucideChartLine,
  lucideGlobe,
  lucideHouse,
  lucideSmartphone,
  lucideTags
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
      lucideChartLine,
      lucideGlobe,
      lucideHouse,
      lucideSmartphone,
      lucideTags
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
            <ng-icon name="lucideChartLine" class="text-sm" />
            GTM Event Showcase
          </span>
          <div class="space-y-4">
            <h1 class="sample-page-title max-w-3xl text-slate-950">
              Travel-booking flows rebuilt on Tailwind v4 and Spartan NG.
            </h1>
            <p class="sample-copy max-w-2xl text-lg">
              Explore a polished demo storefront that keeps the original GTM
              routes and analytics behavior intact while modernizing the
              storefront experience.
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
              Open mobile deep-link demo
            </a>
          </div>
        </div>

        <div class="sample-inset-surface grid gap-4 p-5">
          <div class="rounded-2xl bg-slate-950 px-5 py-4 text-white">
            <div
              class="text-sm font-semibold tracking-[0.22em] text-blue-200 uppercase"
            >
              Demo flow
            </div>
            <div class="mt-3 text-2xl font-semibold">
              Home -> Destinations -> Detail -> Basket -> Checkout
            </div>
            <div class="mt-2 text-sm leading-6 text-slate-200">
              Use this site to exercise list views, promotions, consent, basket,
              and checkout events without changing the original routing model.
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <div
                class="text-sm font-semibold tracking-[0.22em] text-slate-400 uppercase"
              >
                Frontend stack
              </div>
              <div class="mt-2 text-lg font-semibold text-slate-900">
                CSS + TailwindCSS v4 + Spartan NG
              </div>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <div
                class="text-sm font-semibold tracking-[0.22em] text-slate-400 uppercase"
              >
                Data layer
              </div>
              <div class="mt-2 text-lg font-semibold text-slate-900">
                GTM + Firebase sample flows
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
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
        'Showcase room, package, and occupancy-related events with a layout designed for richer ecommerce storytelling.'
    },
    {
      icon: 'lucideGlobe',
      accent: 'bg-emerald-100 text-emerald-700',
      title: 'Incredible Locations',
      description:
        'Browse destination detail flows that mirror real-world discovery journeys across search, list, and detail screens.'
    },
    {
      icon: 'lucideTags',
      accent: 'bg-amber-100 text-amber-700',
      title: 'Pricing & Promotions',
      description:
        'Use the paired mobile app deep link to validate promotion clicks, attribution parameters, and conversion events.'
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
