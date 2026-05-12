import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicDestinations } from './destination-catalog';
import { AnalyticsService } from '../analytics/analytics.service';
import { DestinationService } from './destination.service';

describe('DestinationService', () => {
  const analyticsService = {
    trackEvent: vi.fn()
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    analyticsService.trackEvent.mockReset();
    localStorage.clear();
  });

  it('loads and stores the selected destination in browser mode', () => {
    const storedDestination = publicDestinations[0];
    localStorage.setItem('destination', JSON.stringify(storedDestination));

    TestBed.configureTestingModule({
      providers: [
        DestinationService,
        {
          provide: AnalyticsService,
          useValue: analyticsService
        },
        {
          provide: PLATFORM_ID,
          useValue: 'browser'
        }
      ]
    });

    const service = TestBed.inject(DestinationService);
    const replacementDestination = publicDestinations[1];

    expect(service.destinationSource$()).toEqual(storedDestination);

    service.changeDestination(replacementDestination);

    expect(service.destinationSource$()).toEqual(replacementDestination);
    expect(JSON.parse(localStorage.getItem('destination') ?? 'null')).toEqual(
      replacementDestination
    );
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'view_item',
      replacementDestination
    );
  });

  it('does not touch localStorage in server mode and starts empty', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    TestBed.configureTestingModule({
      providers: [
        DestinationService,
        {
          provide: AnalyticsService,
          useValue: analyticsService
        },
        {
          provide: PLATFORM_ID,
          useValue: 'server'
        }
      ]
    });

    const service = TestBed.inject(DestinationService);
    service.changeDestination(publicDestinations[0]);

    expect(service.destinationSource$()).toEqual(publicDestinations[0]);
    expect(getItemSpy).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
