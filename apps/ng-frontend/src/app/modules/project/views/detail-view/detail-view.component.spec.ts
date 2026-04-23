import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import {
  ActivatedRoute,
  convertToParamMap,
  Router
} from '@angular/router';
import {
  BehaviorSubject,
} from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataLayerSpec } from '@utils';
import { ReportDetailRouteContext } from '../../components/report-detail.contracts';
import { ReportTabComponent } from '../../components/report-tab/report-tab.component';
import { TagManageTabComponent } from '../../components/tag-manage-tab/tag-manage-tab.component';
import { SnackBarComponent } from '../../../../shared/components/snackbar/snackbar.component';
import { DetailViewComponent } from './detail-view.component';

@Component({
  selector: 'app-report-tab',
  standalone: true,
  template: ''
})
class MockReportTabComponent {
  context = input<ReportDetailRouteContext | undefined>(undefined);
}

@Component({
  selector: 'app-tag-manage-tab',
  standalone: true,
  template: ''
})
class MockTagManageTabComponent {
  tagSpec = input<unknown>(undefined);
}

function createSpec(eventName = 'purchase'): DataLayerSpec {
  return {
    eventName,
    dataLayerSpec: {
      event: eventName
    } as DataLayerSpec['dataLayerSpec'],
    rawGtmTag: {
      tag: {
        name: `${eventName}-tag`
      } as DataLayerSpec['rawGtmTag']['tag'],
      trigger: []
    }
  };
}

describe('DetailViewComponent', () => {
  const routeSnapshot: {
    queryParams: Record<string, string>;
  } = {
    queryParams: {
      tab: 'reports'
    }
  };
  const routeData$ = new BehaviorSubject({
    projectSlug: 'storybook-project',
    eventId: 'evt-1',
    spec: createSpec(),
    recording: {
      title: 'Purchase recording',
      steps: []
    },
    reportDetails: {
      testEvent: {
        eventId: 'evt-1',
        eventName: 'purchase',
        message: 'Failed run',
        createdAt: new Date('2026-04-21T00:00:00.000Z'),
        updatedAt: new Date('2026-04-22T00:00:00.000Z')
      },
      testEventDetails: {
        passed: false,
        requestPassed: false,
        destinationUrl: 'https://example.com',
        rawRequest: 'POST /collect'
      },
      testImage: {}
    },
    video: {
      blob: new Blob(['video'], { type: 'video/webm' })
    },
    image: {
      blob: new Blob(['image'], { type: 'image/png' })
    },
    fileReports: [
      {
        testEventDetails: [
          {
            eventId: 'evt-1'
          }
        ]
      }
    ]
  });
  const queryParamMap$ = new BehaviorSubject(
    convertToParamMap({ tab: 'reports' })
  );

  const router = {
    navigate: vi.fn().mockResolvedValue(true)
  };
  const snackBar = {
    openFromComponent: vi.fn()
  };

  beforeEach(async () => {
    router.navigate.mockClear();
    snackBar.openFromComponent.mockClear();
    routeData$.next({
      projectSlug: 'storybook-project',
      eventId: 'evt-1',
      spec: createSpec(),
      recording: {
        title: 'Purchase recording',
        steps: []
      },
      reportDetails: {
        testEvent: {
          eventId: 'evt-1',
          eventName: 'purchase',
          message: 'Failed run',
          createdAt: new Date('2026-04-21T00:00:00.000Z'),
          updatedAt: new Date('2026-04-22T00:00:00.000Z')
        },
        testEventDetails: {
          passed: false,
          requestPassed: false,
          destinationUrl: 'https://example.com',
          rawRequest: 'POST /collect'
        },
        testImage: {}
      },
      video: {
        blob: new Blob(['video'], { type: 'video/webm' })
      },
      image: {
        blob: new Blob(['image'], { type: 'image/png' })
      },
      fileReports: [
        {
          testEventDetails: [
            {
              eventId: 'evt-1'
            }
          ]
        }
      ]
    });
    routeSnapshot.queryParams = {
      tab: 'reports'
    };
    queryParamMap$.next(convertToParamMap({ tab: 'reports' }));

    await TestBed.configureTestingModule({
      imports: [DetailViewComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            data: routeData$.asObservable(),
            queryParamMap: queryParamMap$.asObservable(),
            snapshot: routeSnapshot
          }
        },
        {
          provide: Router,
          useValue: router
        }
      ]
    })
      .overrideProvider(MatSnackBar, {
        useValue: snackBar
      })
      .overrideComponent(DetailViewComponent, {
        remove: {
          imports: [ReportTabComponent, TagManageTabComponent]
        },
        add: {
          imports: [MockReportTabComponent, MockTagManageTabComponent]
        }
      })
      .compileComponents();
  });

  it('builds a route context and passes it into the report tab', async () => {
    const fixture = TestBed.createComponent(DetailViewComponent);

    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const reportTab = fixture.debugElement.query(
      By.directive(MockReportTabComponent)
    ).componentInstance as MockReportTabComponent;

    expect(component.routeContext()).toEqual(
      expect.objectContaining({
        projectSlug: 'storybook-project',
        eventId: 'evt-1',
        historyLinkCommands: ['..', 'buckets']
      })
    );
    expect(component.routeContext()?.reportDetails).toEqual(
      expect.objectContaining({
        event: 'purchase',
        eventName: 'purchase',
        createdAt: new Date('2026-04-21T00:00:00.000Z'),
        passed: false,
        requestPassed: false,
        rawRequest: 'POST /collect',
        destinationUrl: 'https://example.com',
        updatedAt: new Date('2026-04-22T00:00:00.000Z')
      })
    );
    expect(component.tagSpec()?.event).toBe('purchase');
    expect(reportTab.context()?.projectSlug).toBe('storybook-project');
    expect(reportTab.context()?.reportDetails?.eventName).toBe('purchase');
    expect(component.selectedTabIndex).toBe(1);
  });

  it('shows the missing recording snackbar and strips the query param from the url', async () => {
    const fixture = TestBed.createComponent(DetailViewComponent);
    routeSnapshot.queryParams = {
      tab: 'reports',
      snackbar: 'missingRecording'
    };

    (fixture.componentInstance as never as {
      handleQueryParams: (params: ReturnType<typeof convertToParamMap>) => void;
    }).handleQueryParams(
      convertToParamMap({ tab: 'reports', snackbar: 'missingRecording' })
    );
    await Promise.resolve();

    expect(snackBar.openFromComponent).toHaveBeenCalledWith(
      SnackBarComponent,
      {
        duration: 5000,
        data: 'Please add a Chrome Recording to this event before running tests.'
      }
    );
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: {
        tab: 'reports'
      },
      replaceUrl: true
    });
  });

  it('navigates back relative to the current route', () => {
    const fixture = TestBed.createComponent(DetailViewComponent);

    fixture.detectChanges();
    fixture.componentInstance.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['../'], {
      relativeTo: expect.anything()
    });
  });
});
