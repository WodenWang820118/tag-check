import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataLayerSpec, VariableConfig } from '@utils';
import {
  buildReportPage,
  ReportDetailRouteContext
} from '../../components/report-detail.contracts';
import { ReportTabComponent } from '../../components/report-tab/report-tab.component';
import { TagManageTabComponent } from '../../components/tag-manage-tab/tag-manage-tab.component';
import { SnackBarComponent } from '../../../../shared/components/snackbar/snackbar.component';
import { ProjectService } from '../../../../shared/services/api/project-info/project-info.service';
import { DetailViewComponent } from './detail-view.component';

@Component({
  selector: 'app-report-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
class MockReportTabComponent {
  context = input<ReportDetailRouteContext | undefined>(undefined);
}

@Component({
  selector: 'app-tag-manage-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
class MockTagManageTabComponent {
  tagSpec = input<unknown>(undefined);
  variables = input<readonly VariableConfig[]>([]);
}

const MEASUREMENT_ID_CONSTANT: VariableConfig = {
  accountId: '1',
  containerId: '2',
  name: 'CONST - Measurement ID',
  type: 'c',
  parameter: [{ type: 'TEMPLATE', key: 'value', value: 'G-8HKQR5ZBSK' }]
};

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

function createPage(): ReportDetailRouteContext {
  return buildReportPage({
    projectSlug: 'storybook-project',
    eventId: 'evt-1',
    detail: null,
    spec: createSpec(),
    recording: { title: 'Purchase recording', steps: [] },
    video: { blob: new Blob(['video'], { type: 'video/webm' }) },
    tagAssistantVideo: null,
    image: { blob: new Blob(['image'], { type: 'image/png' }) }
  });
}

describe('DetailViewComponent', () => {
  const routeSnapshot: {
    queryParams: Record<string, string>;
  } = {
    queryParams: {
      tab: 'reports'
    }
  };
  const routeData$ = new BehaviorSubject<{ page: ReportDetailRouteContext }>({
    page: createPage()
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
  const projectService = {
    getProjectGtmConfig: vi.fn(() =>
      of({ containerVersion: { variable: [MEASUREMENT_ID_CONSTANT] } })
    )
  };

  beforeEach(async () => {
    router.navigate.mockClear();
    snackBar.openFromComponent.mockClear();
    routeData$.next({ page: createPage() });
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
        },
        { provide: ProjectService, useValue: projectService }
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

  it('passes the resolved report page into the report tab', async () => {
    const fixture = TestBed.createComponent(DetailViewComponent);

    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const reportTab = fixture.debugElement.query(
      By.directive(MockReportTabComponent)
    ).componentInstance as MockReportTabComponent;

    expect(component.routeContext()).toBe(routeData$.value.page);
    expect(reportTab.context()).toBe(routeData$.value.page);
    expect(component.tagSpec()?.event).toBe('purchase');
    expect(component.selectedTabIndex).toBe(1);
  });

  it("passes the project's container variables into the tag tab", () => {
    // Without ?tab=reports the page opens on the Tag Snapshot tab.
    routeSnapshot.queryParams = {};
    queryParamMap$.next(convertToParamMap({}));
    const fixture = TestBed.createComponent(DetailViewComponent);

    fixture.detectChanges();

    const tagTab = fixture.debugElement.query(
      By.directive(MockTagManageTabComponent)
    ).componentInstance as MockTagManageTabComponent;
    expect(projectService.getProjectGtmConfig).toHaveBeenCalledWith(
      'storybook-project'
    );
    expect(tagTab.variables()).toEqual([MEASUREMENT_ID_CONSTANT]);
  });

  it('shows the missing recording snackbar and strips the query param from the url', async () => {
    const fixture = TestBed.createComponent(DetailViewComponent);
    routeSnapshot.queryParams = {
      tab: 'reports',
      snackbar: 'missingRecording'
    };

    (
      fixture.componentInstance as never as {
        handleQueryParams: (
          params: ReturnType<typeof convertToParamMap>
        ) => void;
      }
    ).handleQueryParams(
      convertToParamMap({ tab: 'reports', snackbar: 'missingRecording' })
    );
    await Promise.resolve();

    expect(snackBar.openFromComponent).toHaveBeenCalledWith(SnackBarComponent, {
      duration: 5000,
      data: 'Please add a Chrome Recording to this event before running tests.'
    });
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
