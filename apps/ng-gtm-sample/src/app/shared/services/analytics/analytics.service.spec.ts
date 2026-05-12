import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JavascriptInterfaceService } from '../javascript-interface/javascript-interface.service';
import { AnalyticsEventTrackerFactory } from './analytics-factory';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const analyticsEventTrackerFactory = {
    createEvent: vi.fn()
  };
  const javascriptInterfaceService = {
    logEvent: vi.fn()
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    analyticsEventTrackerFactory.createEvent.mockReset();
    javascriptInterfaceService.logEvent.mockReset();
  });

  it('stays server-safe and no-ops browser-only persistence on the server path', async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    TestBed.configureTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: AnalyticsEventTrackerFactory,
          useValue: analyticsEventTrackerFactory
        },
        {
          provide: JavascriptInterfaceService,
          useValue: javascriptInterfaceService
        },
        {
          provide: PLATFORM_ID,
          useValue: 'server'
        }
      ]
    });

    const service = TestBed.inject(AnalyticsService);
    const result = await firstValueFrom(
      service.saveDataLayerEvent('page_view', { page: 'home' })
    );

    expect(service.checkoutOrders$()).toEqual([]);
    expect(result).toBe('');
    expect(getItemSpy).not.toHaveBeenCalled();
    expect(javascriptInterfaceService.logEvent).not.toHaveBeenCalled();

    getItemSpy.mockRestore();
  });
});
