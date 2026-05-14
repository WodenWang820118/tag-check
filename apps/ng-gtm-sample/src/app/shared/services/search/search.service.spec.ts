import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicDestinations } from '../destination/destination-catalog';
import { AnalyticsService } from '../analytics/analytics.service';
import { SearchService } from './search.service';

describe('SearchService', () => {
  const analyticsService = {
    trackEvent: vi.fn()
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    analyticsService.trackEvent.mockReset();

    TestBed.configureTestingModule({
      providers: [
        SearchService,
        {
          provide: AnalyticsService,
          useValue: analyticsService
        }
      ]
    });
  });

  it('returns the full catalog when the query is empty', () => {
    const service = TestBed.inject(SearchService);

    expect(service.searchResults$()).toEqual(publicDestinations);
  });

  it('filters the public catalog and tracks non-empty searches', () => {
    const service = TestBed.inject(SearchService);

    service.search('switzerland');

    expect(service.searchQuery$()).toBe('switzerland');
    expect(
      service.searchResults$().map((destination) => destination.slug)
    ).toEqual(['switzerland']);
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'search',
      'switzerland'
    );
  });

  it('clears the current query without firing analytics', () => {
    const service = TestBed.inject(SearchService);

    service.search('switzerland');
    analyticsService.trackEvent.mockClear();

    service.resetSearch();

    expect(service.searchQuery$()).toBe('');
    expect(service.searchResults$()).toEqual(publicDestinations);
    expect(analyticsService.trackEvent).not.toHaveBeenCalled();
  });
});
