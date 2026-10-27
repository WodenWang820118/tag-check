import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  Params,
  Router,
  RouterLink
} from '@angular/router';
import { distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { describeFallbackMatch, StepFallback, VariableConfig } from '@utils';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TagManageTabComponent } from '../../components/tag-manage-tab/tag-manage-tab.component';
import { ReportDetailPanelsComponent } from '../../components/report-detail-panels/report-detail-panels.component';
import { ReportTabFacade } from '../../components/report-tab/report-tab-facade.service';
import { RunVerdictComponent } from '../../components/run-detail/run-verdict/run-verdict.component';
import {
  describeStep,
  RunPlayerComponent
} from '../../components/run-detail/run-player/run-player.component';
import {
  SelectorHealDialogComponent,
  type SelectorHealDialogData,
  type SelectorHealDialogResult
} from '../../components/run-detail/selector-heal/selector-heal-dialog.component';
import {
  SaveFallbackDialogComponent,
  type SaveFallbackDialogData,
  type SaveFallbackDialogResult
} from '../../components/run-detail/selector-heal/save-fallback-dialog.component';
import { selectorGroupText } from '../../components/run-detail/selector-heal/selector-heal';
import { SpecComparisonComponent } from '../../components/run-detail/spec-comparison/spec-comparison.component';
import { Ga4RequestComponent } from '../../components/run-detail/ga4-request/ga4-request.component';
import { SnackBarComponent } from '../../../../shared/components/snackbar/snackbar.component';
import { ProjectService } from '../../../../shared/services/api/project-info/project-info.service';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import {
  ReportDetailRouteContext,
  toTagSpec
} from '../../components/report-detail.contracts';

function serializeParamMap(params: ParamMap): string {
  return JSON.stringify(
    [...params.keys]
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, params.getAll(key)])
  );
}

/**
 * A test's page, loaded by reportPageResolver: a run's verdict (each check
 * and the test's recent runs), what happened (both recordings on one
 * timeline), what the spec asks next to what was pushed, the GA4 request,
 * and the tag, spec, recording and item definition to look up or edit.
 * `?run=<runId>` picks the run, the latest by default;
 * `?snackbar=missingRecording` says why the test cannot run yet.
 */
@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
    TagManageTabComponent,
    ReportDetailPanelsComponent,
    RunVerdictComponent,
    RunPlayerComponent,
    SpecComparisonComponent,
    Ga4RequestComponent
  ],
  providers: [ReportTabFacade],
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailViewComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly projectService = inject(ProjectService);
  private readonly reportFacade = inject(ReportTabFacade);
  private readonly testRunning = inject(TestRunningFacadeService);
  private readonly dialog = inject(MatDialog);

  /** Loaded by reportPageResolver. */
  routeContext = toSignal(
    this.route.data.pipe(
      map((data) => data['page'] as ReportDetailRouteContext | undefined)
    )
  );
  tagSpec = computed(() => toTagSpec(this.routeContext()?.spec));
  title = computed(
    () =>
      this.routeContext()?.spec?.rawGtmTag?.tag?.name ||
      this.routeContext()?.reportDetails?.testName ||
      'Test'
  );
  eventName = computed(
    () => this.routeContext()?.reportDetails?.eventName ?? ''
  );
  run = computed(() => this.routeContext()?.run ?? null);
  /**
   * The step of the shown run that could not find its element, as the page
   * names it: `Step 5 · Click [data-testid="add"]`.
   */
  stepFailureLabel = computed(() => {
    const failure = this.routeContext()?.stepFailure;
    return failure ? this.stepLabel(failure.stepIndex, failure.stepType) : null;
  });
  /** Steps saved with their fallback selector since the page loaded. */
  private readonly savedFallbacks = signal<number[]>([]);
  /**
   * The steps of the shown run that continued with a fallback selector,
   * each with how the page names it, why the fallback was chosen, and
   * whether the recording already waits for it first.
   */
  stepFallbacks = computed(() => {
    const context = this.routeContext();
    return (context?.stepFallbacks ?? []).map((fallback) => {
      const recorded =
        context?.recording?.steps?.[fallback.stepIndex]?.selectors?.[0];
      return {
        fallback,
        label: this.stepLabel(fallback.stepIndex, fallback.stepType),
        reason: describeFallbackMatch(fallback),
        saved:
          this.savedFallbacks().includes(fallback.stepIndex) ||
          (recorded !== undefined &&
            selectorGroupText(recorded) === fallback.selectors[0])
      };
    });
  });
  hasRecording = computed(
    () => (this.routeContext()?.videoBlob?.size ?? 0) > 0
  );
  /** Whether this test is the one running; the backend runs one at a time. */
  running = computed(
    () =>
      this.testRunning.isRunningTest$() &&
      this.testRunning.eventRunningTest$() === this.routeContext()?.eventId
  );
  busy = this.testRunning.isRunningTest$;

  /**
   * The project's container variables, which resolve the tag's references.
   * They load after the page shows; until then it shows the references.
   */
  variables = toSignal(
    this.route.data.pipe(
      map(
        (data) =>
          (data['page'] as ReportDetailRouteContext | undefined)?.projectSlug
      ),
      distinctUntilChanged(),
      switchMap((projectSlug) =>
        projectSlug
          ? this.projectService.getProjectGtmConfig(projectSlug)
          : of(null)
      ),
      map((container) => container?.containerVersion?.variable ?? [])
    ),
    { initialValue: [] as VariableConfig[] }
  );

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        startWith(convertToParamMap(this.route.snapshot.queryParams)),
        distinctUntilChanged(
          (previous, current) =>
            serializeParamMap(previous) === serializeParamMap(current)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((params) => this.handleQueryParams(params));
  }

  goBack() {
    void this.router.navigate(['../'], { relativeTo: this.route });
  }

  /** Runs the test again, then shows its new run. */
  runAgain() {
    const context = this.routeContext();
    if (!context || this.busy()) {
      return;
    }
    this.testRunning
      .runTestForReport(context.eventId, context.projectSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.showLatestRun(),
        error: () =>
          this.snackBar.openFromComponent(SnackBarComponent, {
            duration: 5000,
            data: 'The run did not finish. See the message on the Tests page.'
          })
      });
  }

  /**
   * Opens the side panel that finds a replacement for the shown run's step
   * that could not find its element. A trial run in it shows afterwards.
   */
  findReplacement() {
    const context = this.routeContext();
    const run = context?.run;
    const stepLabel = this.stepFailureLabel();
    if (!context || !run || !stepLabel) {
      return;
    }
    this.dialog
      .open<
        SelectorHealDialogComponent,
        SelectorHealDialogData,
        SelectorHealDialogResult
      >(SelectorHealDialogComponent, {
        data: {
          projectSlug: context.projectSlug,
          eventId: context.eventId,
          runId: run.id,
          stepLabel
        },
        // A side panel: the run's recordings stay in view.
        position: { top: '0', right: '0' },
        height: '100vh',
        width: 'min(48rem, 100vw)',
        maxWidth: '100vw',
        panelClass: 'side-sheet-panel',
        // The panel closes itself, so a trial run it made still shows.
        disableClose: true
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { run: result.runId },
            queryParamsHandling: 'merge'
          });
        }
      });
  }

  /**
   * Opens the dialog that writes a fallback selector the shown run used
   * into its step of the recording.
   */
  saveFallback(fallback: StepFallback, stepLabel: string) {
    const context = this.routeContext();
    if (!context) {
      return;
    }
    this.dialog
      .open<
        SaveFallbackDialogComponent,
        SaveFallbackDialogData,
        SaveFallbackDialogResult
      >(SaveFallbackDialogComponent, {
        data: {
          projectSlug: context.projectSlug,
          eventId: context.eventId,
          fallback,
          stepLabel
        },
        width: 'min(56rem, 100vw)'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (saved) {
          this.savedFallbacks.update((steps) => [...steps, fallback.stepIndex]);
        }
      });
  }

  /** A step as the page names it: `Step 5 · Click [data-testid="add"]`. */
  private stepLabel(stepIndex: number, stepType: string): string {
    const step = this.routeContext()?.recording?.steps?.[stepIndex];
    const described = step ? describeStep(step) : null;
    return [
      `Step ${stepIndex + 1}`,
      described
        ? [described.label, described.detail].filter(Boolean).join(' ')
        : stepType
    ].join(' · ');
  }

  /** The test's latest run, which the page shows without `?run=`. */
  showLatestRun() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { run: null },
      queryParamsHandling: 'merge'
    });
  }

  exportSpreadsheet() {
    const context = this.routeContext();
    this.reportFacade.shareSpreadsheet(
      context?.projectSlug,
      context?.reportDetails
    );
  }

  exportRecording() {
    const context = this.routeContext();
    this.reportFacade.exportRecording(
      context?.projectSlug,
      context?.reportDetails,
      context?.videoBlob
    );
  }

  exportEvent() {
    const context = this.routeContext();
    this.reportFacade.exportEvent(
      context?.projectSlug,
      context?.reportDetails,
      context?.videoBlob
    );
  }

  copyEventName() {
    this.reportFacade.copyEventName(this.eventName());
  }

  private handleQueryParams(params: ParamMap) {
    if (params.get('snackbar') === 'missingRecording') {
      this.snackBar.openFromComponent(SnackBarComponent, {
        duration: 5000,
        data: 'Please add a Chrome Recording to this event before running tests.'
      });

      const queryParams: Params = { ...this.route.snapshot.queryParams };
      delete queryParams['snackbar'];
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl: true
      });
    }
  }
}
