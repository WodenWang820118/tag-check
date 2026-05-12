import { ActivatedRoute, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
  const queryParams$ = new BehaviorSubject<Record<string, string>>({});
  const router = {
    navigate: vi.fn()
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    router.navigate.mockReset();
    queryParams$.next({});

    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        {
          provide: Router,
          useValue: router
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParams$.asObservable()
          }
        }
      ]
    });
  });

  it('resolves a destination id to its public slug', () => {
    const service = TestBed.inject(NavigationService);

    service.navigateToDetail('city001');

    expect(router.navigate).toHaveBeenCalledWith(
      ['product/details/switzerland'],
      {
        queryParams: {}
      }
    );
  });

  it('keeps a known public slug unchanged when navigating to details', () => {
    const service = TestBed.inject(NavigationService);

    service.navigateToDetail('switzerland');

    expect(router.navigate).toHaveBeenCalledWith(
      ['product/details/switzerland'],
      {
        queryParams: {}
      }
    );
  });

  it('preserves app_source when building navigation query params', () => {
    queryParams$.next({ app_source: 'email-campaign' });
    const service = TestBed.inject(NavigationService);

    service.navigateToDestinationResults('island');

    expect(router.navigate).toHaveBeenCalledWith(['product/destinations'], {
      queryParams: {
        app_source: 'email-campaign',
        search_term: 'island'
      }
    });
  });
});
