import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { DestinationService } from '../../../../shared/services/destination/destination.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { SearchService } from '../../../../shared/services/search/search.service';
import { UtilsService } from '../../../../shared/services/utils/utils.service';
import { WindowSizeService } from '../../../../shared/services/window-size/window-size.service';
import { YoutubeService } from '../../../../shared/services/youtube/youtube.service';
import { DestinationComponent } from './destination.component';

describe('DestinationComponent', () => {
  let fixture: ComponentFixture<DestinationComponent>;
  let component: DestinationComponent;

  const queryParams$ = new BehaviorSubject(
    convertToParamMap({ search_term: 'islands' })
  );

  const activatedRouteMock = {
    queryParamMap: queryParams$.asObservable(),
    snapshot: {
      queryParamMap: convertToParamMap({ search_term: 'islands' })
    }
  };

  const destinationServiceMock = {
    changeDestination: vi.fn(),
    trackSelectItem: vi.fn()
  };

  const navigationServiceMock = {
    navigateToDetail: vi.fn(),
    navigateToDestinationResults: vi.fn()
  };

  const searchServiceMock = {
    searchResults$: signal([]),
    search: vi.fn(),
    resetSearch: vi.fn()
  };

  const analyticsServiceMock = {
    trackEvent: vi.fn()
  };

  const youtubeServiceMock = {
    trackVideoEvent: vi.fn(),
    stopProgressTracking: vi.fn()
  };

  const windowSizeServiceMock = {
    width$: signal(1280)
  };

  const utilsServiceMock = {
    truncateText: vi.fn((text: string) => text)
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    queryParams$.next(convertToParamMap({ search_term: 'islands' }));
    searchServiceMock.search.mockReset();
    searchServiceMock.resetSearch.mockReset();
    navigationServiceMock.navigateToDestinationResults.mockReset();

    await TestBed.configureTestingModule({
      imports: [DestinationComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRouteMock
        },
        {
          provide: DestinationService,
          useValue: destinationServiceMock
        },
        {
          provide: NavigationService,
          useValue: navigationServiceMock
        },
        {
          provide: SearchService,
          useValue: searchServiceMock
        },
        {
          provide: AnalyticsService,
          useValue: analyticsServiceMock
        },
        {
          provide: YoutubeService,
          useValue: youtubeServiceMock
        },
        {
          provide: WindowSizeService,
          useValue: windowSizeServiceMock
        },
        {
          provide: UtilsService,
          useValue: utilsServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DestinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes the search Signal Form with the query param and updates when typing', () => {
    expect(component.searchForm.searchTerm().value()).toBe('islands');

    const searchInput = fixture.nativeElement.querySelector(
      '[data-testid="search-input"]'
    ) as HTMLInputElement | null;

    expect(searchInput).not.toBeNull();
    if (!searchInput) {
      throw new Error('Expected search input to be present');
    }

    searchInput.value = 'tokyo';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.searchForm.searchTerm().value()).toBe('tokyo');
    expect(component.searchModel()).toEqual({ searchTerm: 'tokyo' });

    component.onSubmit();
    expect(
      navigationServiceMock.navigateToDestinationResults
    ).toHaveBeenCalledWith('tokyo');
    expect(searchServiceMock.search).toHaveBeenCalledWith('tokyo');
  });
});
