import { MatDialog } from '@angular/material/dialog';
import { SelectorHealDialogComponent } from '../../components/run-detail/selector-heal/selector-heal-dialog.component';
import { SaveFallbackDialogComponent } from '../../components/run-detail/selector-heal/save-fallback-dialog.component';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  input
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import {
  ActivatedRoute,
  convertToParamMap,
  Router,
  RouterLink
} from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DataLayerSpec,
  REPORT_DETAIL_SAMPLE,
  ReportDetailResponse,
  Recording,
  VariableConfig
} from '@utils';
import {
  buildReportPage,
  ReportDetailRouteContext
} from '../../components/report-detail.contracts';
import { TagManageTabComponent } from '../../components/tag-manage-tab/tag-manage-tab.component';
import { ReportDetailPanelsComponent } from '../../components/report-detail-panels/report-detail-panels.component';
import { RunVerdictComponent } from '../../components/run-detail/run-verdict/run-verdict.component';
import { RunPlayerComponent } from '../../components/run-detail/run-player/run-player.component';
import { SpecComparisonComponent } from '../../components/run-detail/spec-comparison/spec-comparison.component';
import { Ga4RequestComponent } from '../../components/run-detail/ga4-request/ga4-request.component';
import { ReportTabFacade } from '../../components/report-tab/report-tab-facade.service';
import { SnackBarComponent } from '../../../../shared/components/snackbar/snackbar.component';
import { ProjectService } from '../../../../shared/services/api/project-info/project-info.service';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { DetailViewComponent } from './detail-view.component';

@Directive({ selector: '[routerLink]', standalone: true })
class RouterLinkStub {
  routerLink = input<unknown>();
  queryParams = input<unknown>();
}

/** Stand-ins that keep the inputs the page passes them. */
@Component({
  selector: 'app-run-verdict',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class VerdictStub {
  run = input<unknown>();
  runs = input<unknown>();
  eventName = input<unknown>();
}
@Component({
  selector: 'app-run-player',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class PlayerStub {
  siteBlob = input<unknown>();
  tagAssistantBlob = input<unknown>();
  imageBlob = input<unknown>();
  timeline = input<unknown>();
  steps = input<unknown>();
}
@Component({
  selector: 'app-spec-comparison',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class ComparisonStub {
  spec = input<unknown>();
  dataLayer = input<unknown>();
}
@Component({
  selector: 'app-ga4-request',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class RequestStub {
  rawRequest = input<unknown>();
  requestPassed = input<unknown>();
  eventName = input<unknown>();
}
@Component({
  selector: 'app-tag-manage-tab',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class TagStub {
  tagSpec = input<unknown>();
  variables = input<readonly VariableConfig[]>([]);
}
@Component({
  selector: 'app-report-detail-panels',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class PanelsStub {
  context = input<unknown>();
}

const MEASUREMENT_ID_CONSTANT: VariableConfig = {
  accountId: '1',
  containerId: '2',
  name: 'CONST - Measurement ID',
  type: 'c',
  parameter: [{ type: 'TEMPLATE', key: 'value', value: 'G-8HKQR5ZBSK' }]
};

const SPEC = {
  eventName: 'add_to_cart',
  dataLayerSpec: { event: 'add_to_cart' },
  rawGtmTag: { tag: { name: 'GA4 event - add_to_cart' }, trigger: [] }
} as unknown as DataLayerSpec;

/** The page as the resolver builds it from GET /reports (JSON). */
function createPage(
  runId?: number,
  missingRun = false
): ReportDetailRouteContext {
  const detail = JSON.parse(
    JSON.stringify(REPORT_DETAIL_SAMPLE)
  ) as ReportDetailResponse;
  if (runId !== undefined && detail.testEventDetails) {
    detail.testEventDetails.id = runId;
  }
  if (missingRun) {
    detail.testEventDetails = null;
    detail.testImage = null;
  }
  return buildReportPage({
    projectSlug: 'demo',
    eventId: 'evt-1',
    runId,
    detail,
    spec: SPEC,
    recording: { title: 'add_to_cart', steps: [] },
    video: { blob: new Blob(['video'], { type: 'video/webm' }) },
    tagAssistantVideo: { blob: new Blob(['ta'], { type: 'video/webm' }) },
    image: { blob: new Blob(['image'], { type: 'image/png' }) }
  });
}

describe('DetailViewComponent', () => {
  const routeSnapshot: { queryParams: Record<string, string> } = {
    queryParams: {}
  };
  const routeData$ = new BehaviorSubject<{ page: ReportDetailRouteContext }>({
    page: createPage()
  });
  const queryParamMap$ = new BehaviorSubject(convertToParamMap({}));
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const snackBar = { openFromComponent: vi.fn() };
  const projectService = {
    getProjectGtmConfig: vi.fn(() =>
      of({ containerVersion: { variable: [MEASUREMENT_ID_CONSTANT] } })
    )
  };
  const reportFacade = {
    shareSpreadsheet: vi.fn(),
    exportRecording: vi.fn(),
    exportEvent: vi.fn(),
    copyEventName: vi.fn()
  };
  const recordingService = {
    getRecordingDetails: vi.fn(() =>
      of<Recording>({
        title: 'add_to_cart',
        steps: [{ type: 'click', selectors: [['[data-testid="add"]']] }]
      })
    )
  };
  const dialogResult$ = new BehaviorSubject<{ runId: number } | undefined>(
    undefined
  );
  const dialog = {
    open: vi.fn(() => ({ afterClosed: () => dialogResult$.asObservable() }))
  };
  const testRunning = {
    isRunningTest$: vi.fn(() => false),
    eventRunningTest$: vi.fn(() => ''),
    runTestForReport: vi.fn(() =>
      of<ReportDetailResponse | undefined>(
        JSON.parse(
          JSON.stringify({
            ...REPORT_DETAIL_SAMPLE,
            testEventDetails: {
              ...REPORT_DETAIL_SAMPLE.testEventDetails,
              id: 42
            }
          })
        ) as ReportDetailResponse
      )
    )
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    routeData$.next({ page: createPage() });
    routeSnapshot.queryParams = {};
    queryParamMap$.next(convertToParamMap({}));
    testRunning.isRunningTest$.mockReturnValue(false);

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
        { provide: Router, useValue: router },
        { provide: ProjectService, useValue: projectService },
        { provide: RecordingService, useValue: recordingService },
        { provide: TestRunningFacadeService, useValue: testRunning },
        { provide: MatDialog, useValue: dialog }
      ]
    })
      .overrideProvider(MatSnackBar, { useValue: snackBar })
      .overrideComponent(DetailViewComponent, {
        remove: {
          imports: [
            RouterLink,
            RunVerdictComponent,
            RunPlayerComponent,
            SpecComparisonComponent,
            Ga4RequestComponent,
            TagManageTabComponent,
            ReportDetailPanelsComponent
          ],
          providers: [ReportTabFacade]
        },
        add: {
          imports: [
            RouterLinkStub,
            VerdictStub,
            PlayerStub,
            ComparisonStub,
            RequestStub,
            TagStub,
            PanelsStub
          ],
          providers: [{ provide: ReportTabFacade, useValue: reportFacade }]
        }
      })
      .compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function render() {
    const fixture = TestBed.createComponent(DetailViewComponent);
    fixture.detectChanges();
    return fixture;
  }

  const child = <T>(
    fixture: ReturnType<typeof render>,
    type: new (...args: never[]) => T
  ) => fixture.debugElement.query(By.directive(type)).componentInstance as T;

  const byTestId = (fixture: ReturnType<typeof render>, id: string) =>
    fixture.nativeElement.querySelector(
      `[data-testid="${id}"]`
    ) as HTMLElement | null;

  it("shows the run's verdict, recordings, comparison and request", () => {
    const fixture = render();
    const page = routeData$.value.page;

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain(
      'GA4 event - add_to_cart'
    );
    expect(byTestId(fixture, 'detail-run')?.textContent).toContain('Run #7');
    expect(child(fixture, VerdictStub).run()).toBe(page.run);
    expect(child(fixture, VerdictStub).runs()).toBe(page.runs);
    expect(child(fixture, PlayerStub).siteBlob()).toBe(page.videoBlob);
    expect(child(fixture, PlayerStub).timeline()).toEqual(
      REPORT_DETAIL_SAMPLE.testEventDetails.mediaTimeline
    );
    expect(child(fixture, ComparisonStub).spec()).toEqual({
      event: 'add_to_cart'
    });
    expect(child(fixture, ComparisonStub).dataLayer()).toBe(
      page.run?.dataLayer
    );
    expect(child(fixture, RequestStub).rawRequest()).toBe(page.run?.rawRequest);
    expect(child(fixture, PanelsStub).context()).toBe(page);
    expect(byTestId(fixture, 'detail-older-run')).toBeNull();
  });

  describe('a step that could not find its element', () => {
    /** The page of a run whose step 1 could not find its element. */
    function failedPage(): ReportDetailRouteContext {
      const page = createPage();
      return {
        ...page,
        recording: {
          title: 'add_to_cart',
          steps: [{ type: 'click', selectors: [['[data-testid="add"]']] }]
        },
        stepFailure: {
          stepIndex: 0,
          stepType: 'click',
          url: 'https://shop.example/'
        }
      };
    }

    it('names the step and offers a replacement', () => {
      routeData$.next({ page: failedPage() });
      const fixture = render();

      expect(
        byTestId(fixture, 'detail-step-failure')?.textContent?.replace(
          /\s+/g,
          ' '
        )
      ).toContain(
        'Step 1 · Click [data-testid="add"] could not find its element'
      );
    });

    it('opens the side panel for the shown run, then shows its trial run', () => {
      routeData$.next({ page: failedPage() });
      dialogResult$.next({ runId: 42 });
      const fixture = render();

      byTestId(fixture, 'detail-find-replacement')?.click();

      expect(dialog.open).toHaveBeenCalledWith(
        SelectorHealDialogComponent,
        expect.objectContaining({
          data: {
            projectSlug: 'demo',
            eventId: 'evt-1',
            runId: 7,
            stepLabel: 'Step 1 · Click [data-testid="add"]'
          },
          disableClose: true
        })
      );
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: { run: 42 },
        queryParamsHandling: 'merge'
      });
    });

    it('stays on the run when the panel closes without a trial', () => {
      routeData$.next({ page: failedPage() });
      dialogResult$.next(undefined);
      const fixture = render();

      byTestId(fixture, 'detail-find-replacement')?.click();

      expect(dialog.open).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('names the step by its type when the recording lacks it', () => {
      routeData$.next({ page: { ...failedPage(), recording: null } });
      const fixture = render();

      expect(byTestId(fixture, 'detail-step-failure')?.textContent).toContain(
        'Step 1 · click could not find its element'
      );
    });

    it('offers nothing for a run without one', () => {
      const fixture = render();

      expect(byTestId(fixture, 'detail-step-failure')).toBeNull();
    });
  });

  describe('a step that used a fallback selector', () => {
    const fallback = {
      stepIndex: 0,
      stepType: 'click',
      selector: '[data-testid="add"]',
      selectors: ['[data-testid="add"]'],
      matchedBy: 'testId' as const,
      value: 'add'
    };

    /** The page of a run whose step 1 continued with a fallback. */
    function fallbackPage(
      recorded = 'main > div.old > [data-testid="add"]'
    ): ReportDetailRouteContext {
      return {
        ...createPage(),
        recording: {
          title: 'add_to_cart',
          steps: [{ type: 'click', selectors: [[recorded]] }]
        },
        stepFallbacks: [fallback]
      };
    }

    const text = (fixture: ReturnType<typeof render>, id: string) =>
      byTestId(fixture, id)?.textContent?.replace(/\s+/g, ' ').trim();

    it('names the step, why the fallback was chosen, and offers to save it', () => {
      routeData$.next({ page: fallbackPage() });
      const fixture = render();

      const shown = text(fixture, 'detail-step-fallback-0');
      expect(shown).toContain(
        'Step 1 · Click main > div.old > [data-testid="add"] used a fallback selector'
      );
      expect(shown).toContain(
        'Its recorded selectors found nothing, and one element matched the recorded test hook "add": [data-testid="add"]'
      );
      expect(byTestId(fixture, 'detail-save-fallback-0')).not.toBeNull();
    });

    it('opens the save dialog, then marks the step saved', () => {
      routeData$.next({ page: fallbackPage() });
      dialog.open.mockReturnValueOnce({
        afterClosed: () => of(true) as never
      });
      const fixture = render();

      byTestId(fixture, 'detail-save-fallback-0')?.click();
      fixture.detectChanges();

      expect(dialog.open).toHaveBeenCalledWith(
        SaveFallbackDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            projectSlug: 'demo',
            eventId: 'evt-1',
            fallback
          })
        })
      );
      expect(byTestId(fixture, 'detail-save-fallback-0')).toBeNull();
      expect(text(fixture, 'detail-fallback-saved-0')).toBe(
        'Saved in the recording'
      );
      expect(recordingService.getRecordingDetails).toHaveBeenCalledWith(
        'demo',
        'evt-1'
      );
      expect(
        fixture.componentInstance.routeContext()?.recording?.steps[0].selectors
      ).toEqual([['[data-testid="add"]']]);
    });

    it('does not mark another test or a reloaded run saved by its step index', () => {
      routeData$.next({ page: fallbackPage() });
      dialog.open.mockReturnValueOnce({
        afterClosed: () => of(true) as never
      });
      const fixture = render();
      byTestId(fixture, 'detail-save-fallback-0')?.click();
      fixture.detectChanges();

      routeData$.next({ page: { ...fallbackPage(), eventId: 'evt-2' } });
      fixture.detectChanges();
      expect(byTestId(fixture, 'detail-fallback-saved-0')).toBeNull();
      expect(byTestId(fixture, 'detail-save-fallback-0')).not.toBeNull();

      routeData$.next({ page: fallbackPage() });
      fixture.detectChanges();
      expect(byTestId(fixture, 'detail-fallback-saved-0')).toBeNull();
    });

    it('uses the refreshed recording when the saved selector differs from the fallback', () => {
      routeData$.next({ page: fallbackPage() });
      recordingService.getRecordingDetails.mockReturnValueOnce(
        of({
          title: 'add_to_cart',
          steps: [{ type: 'click', selectors: [['#different']] }]
        })
      );
      dialog.open.mockReturnValueOnce({
        afterClosed: () => of(true) as never
      });
      const fixture = render();
      byTestId(fixture, 'detail-save-fallback-0')?.click();
      fixture.detectChanges();

      expect(byTestId(fixture, 'detail-fallback-saved-0')).toBeNull();
    });

    it('does not apply a late recording refresh to another test', () => {
      const refreshed = new Subject<Recording>();
      routeData$.next({ page: fallbackPage() });
      recordingService.getRecordingDetails.mockReturnValueOnce(refreshed);
      dialog.open.mockReturnValueOnce({
        afterClosed: () => of(true) as never
      });
      const fixture = render();
      byTestId(fixture, 'detail-save-fallback-0')?.click();

      const otherPage = { ...fallbackPage(), eventId: 'evt-2' };
      routeData$.next({ page: otherPage });
      refreshed.next({
        title: 'add_to_cart',
        steps: [{ type: 'click', selectors: [['[data-testid="add"]']] }]
      });
      refreshed.complete();
      fixture.detectChanges();

      expect(fixture.componentInstance.routeContext()?.recording).toBe(
        otherPage.recording
      );
      expect(byTestId(fixture, 'detail-fallback-saved-0')).toBeNull();
    });

    it('shows it saved when the recording already waits for it', () => {
      routeData$.next({ page: fallbackPage('[data-testid="add"]') });
      const fixture = render();

      expect(byTestId(fixture, 'detail-fallback-saved-0')).not.toBeNull();
      expect(byTestId(fixture, 'detail-save-fallback-0')).toBeNull();
    });
  });

  it("passes the project's container variables into the tag configuration", () => {
    const fixture = render();

    expect(projectService.getProjectGtmConfig).toHaveBeenCalledWith('demo');
    expect(child(fixture, TagStub).variables()).toEqual([
      MEASUREMENT_ID_CONSTANT
    ]);
  });

  it('says when an older run is shown, and goes back to the latest', () => {
    routeData$.next({ page: createPage(5) });
    const fixture = render();

    byTestId(fixture, 'detail-latest-run')?.click();

    expect(byTestId(fixture, 'detail-older-run')).not.toBeNull();
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { run: null },
      queryParamsHandling: 'merge'
    });
  });

  it('runs the test again and shows its new run', () => {
    const fixture = render();

    byTestId(fixture, 'detail-run-again')?.click();

    expect(testRunning.runTestForReport).toHaveBeenCalledWith('evt-1', 'demo');
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { run: 42 } })
    );
  });

  it('stays on the shown run when a stopped run returns no report', () => {
    testRunning.runTestForReport.mockReturnValueOnce(of(undefined));
    render().componentInstance.runAgain();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows Run not found with a link to the latest when a positive run id is missing', () => {
    const page = createPage(999, true);
    routeData$.next({ page });
    const fixture = render();

    expect(byTestId(fixture, 'detail-run-not-found')?.textContent).toContain(
      'Run not found'
    );
    const latest = fixture.debugElement.query(
      By.css('[data-testid="detail-latest-run"]')
    );
    expect(latest.injector.get(RouterLinkStub).queryParams()).toEqual({
      run: null
    });
    expect(child(fixture, VerdictStub).runs()).toEqual(page.runs);
    expect(byTestId(fixture, 'detail-older-run')).toBeNull();
  });

  it('explains that an older run uses the current spec and recording', () => {
    routeData$.next({ page: createPage(5) });
    const fixture = render();
    expect(
      byTestId(fixture, 'detail-current-spec-notice')?.textContent?.trim()
    ).toBe('Compared with the current spec and recording.');
    routeData$.next({ page: createPage() });
    fixture.detectChanges();
    expect(byTestId(fixture, 'detail-current-spec-notice')).toBeNull();
  });

  it('says so when the run does not finish, and stays on the run', () => {
    testRunning.runTestForReport.mockReturnValueOnce(
      throwError(() => new Error('browser crashed'))
    );
    const fixture = render();

    fixture.componentInstance.runAgain();

    expect(snackBar.openFromComponent).toHaveBeenCalledWith(
      SnackBarComponent,
      expect.objectContaining({
        data: 'The run did not finish. See the message on the Tests page.'
      })
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not start a run while another one runs', () => {
    testRunning.isRunningTest$.mockReturnValue(true);
    const fixture = render();

    fixture.componentInstance.runAgain();

    expect(testRunning.runTestForReport).not.toHaveBeenCalled();
    expect(
      (byTestId(fixture, 'detail-run-again') as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it('exports the shown older run and copies the event name', () => {
    routeData$.next({ page: createPage(5) });
    const fixture = render();
    const page = routeData$.value.page;
    const component = fixture.componentInstance;

    component.exportSpreadsheet();
    component.exportRecording();
    component.exportEvent();
    component.copyEventName();

    expect(reportFacade.shareSpreadsheet).toHaveBeenCalledWith(
      'demo',
      page.reportDetails,
      page.run?.id
    );
    expect(reportFacade.exportRecording).toHaveBeenCalledWith(
      'demo',
      page.reportDetails,
      page.videoBlob,
      page.run?.id
    );
    expect(reportFacade.exportEvent).toHaveBeenCalledWith(
      'demo',
      page.reportDetails,
      page.videoBlob,
      page.run?.id
    );
    expect(reportFacade.copyEventName).toHaveBeenCalledWith('add_to_cart');
  });

  it('shows the missing recording snackbar and strips the query param from the url', () => {
    routeSnapshot.queryParams = { snackbar: 'missingRecording', run: '5' };
    queryParamMap$.next(
      convertToParamMap({ snackbar: 'missingRecording', run: '5' })
    );
    render();

    expect(snackBar.openFromComponent).toHaveBeenCalledWith(SnackBarComponent, {
      duration: 5000,
      data: 'Please add a Chrome Recording to this event before running tests.'
    });
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { run: '5' },
      replaceUrl: true
    });
  });

  it('navigates back relative to the current route', () => {
    const fixture = render();

    byTestId(fixture, 'detail-back')?.click();

    expect(router.navigate).toHaveBeenCalledWith(['../'], {
      relativeTo: expect.anything()
    });
  });
});
