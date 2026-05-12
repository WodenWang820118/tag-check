import { computed, Injectable, signal } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { tap } from 'rxjs';
import {
  getPublicDestinationById,
  getPublicDestinationBySlug
} from '../destination/destination-catalog';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private readonly source = signal<string | null>(null);
  readonly source$ = computed(() => this.source());

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {
    this.trackSource().subscribe();
  }

  private getMergedQueryParams(additionalParams: Params = {}) {
    const queryParams: Params = {};
    const source = this.source$();

    if (source) {
      queryParams['app_source'] = source;
    }

    for (const [key, value] of Object.entries(additionalParams)) {
      if (value !== undefined) {
        queryParams[key] = value;
      }
    }

    return queryParams;
  }

  private navigate(path: string, additionalParams: Params = {}) {
    console.log(`Navigating to: ${path}`, additionalParams);
    this.router.navigate([path], {
      queryParams: this.getMergedQueryParams(additionalParams)
    });
  }

  private trackSource() {
    return this.activatedRoute.queryParams.pipe(
      tap((params) => {
        console.log(params);
        if (params['app_source']) {
          this.source.set(params['app_source']);
        }
      })
    );
  }

  navigateToHome() {
    this.navigate('/home');
  }

  navigateToDestinations() {
    this.navigate('product/destinations');
  }

  navigateToDetail(destinationIdOrSlug: string) {
    const destination =
      getPublicDestinationById(destinationIdOrSlug) ??
      getPublicDestinationBySlug(destinationIdOrSlug);
    const slug = destination?.slug ?? destinationIdOrSlug;

    this.navigate(`product/details/${slug}`);
  }

  navigateToBasket() {
    this.navigate('transaction/basket');
  }

  navigateToLogin() {
    console.log('navigate to login');
    this.navigate('/home/login');
  }

  navigateToAdmin() {
    this.navigate('admin/dashboard');
  }

  navigateToAddData() {
    this.navigate('admin/add-data');
  }

  navigateToThankYou() {
    this.navigate('transaction/thankyou');
  }

  navigateToCheckout() {
    this.navigate('transaction/checkout');
  }

  navigateToDestinationResults(query: string) {
    this.navigate('product/destinations', {
      search_term: query
    });
  }
}
