import { computed, Injectable, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
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

  private getMergedQueryParams(additionalParams: any = {}) {
    // Always include app_source if it's available
    const queryParams: any = { app_source: this.source$() };

    // Merge additionalParams only if they are explicitly provided
    for (const key in additionalParams) {
      if (additionalParams.hasOwnProperty(key)) {
        queryParams[key] = additionalParams[key];
      }
    }

    return queryParams;
  }

  private navigate(path: string, additionalParams: any = {}) {
    console.log(`Navigating to: ${path}`, additionalParams);
    this.router.navigate([path], {
      queryParams: this.getMergedQueryParams(additionalParams),
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

  navigateToDetail(id: string) {
    this.navigate(`product/details/${id}`);
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
      search_term: query,
    });
  }
}
