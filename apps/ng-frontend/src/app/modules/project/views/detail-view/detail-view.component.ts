import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  Params,
  Router
} from '@angular/router';
import { distinctUntilChanged, startWith } from 'rxjs';
import {
  DataLayerSpec,
  FrontFileReport,
  IReportDetails,
  Recording,
  TestEvent,
  TestEventDetail,
  TestImage
} from '@utils';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportTabComponent } from '../../components/report-tab/report-tab.component';
import { TagManageTabComponent } from '../../components/tag-manage-tab/tag-manage-tab.component';
import { SnackBarComponent } from '../../../../shared/components/snackbar/snackbar.component';
import {
  ReportDetailRouteContext,
  toTagSpec
} from '../../components/report-detail.contracts';

function buildFlattenedReportDetails(
  reportDetailsObject:
    | {
        testEvent: TestEvent;
        testEventDetails: TestEventDetail;
        testImage: TestImage;
      }
    | undefined
): IReportDetails | undefined {
  if (!reportDetailsObject) {
    return undefined;
  }

  return {
    ...reportDetailsObject.testEvent,
    ...reportDetailsObject.testEventDetails,
    ...reportDetailsObject.testImage,
    position: 0,
    event: reportDetailsObject.testEvent.eventName
  };
}

function serializeParamMap(params: ParamMap): string {
  return JSON.stringify(
    [...params.keys]
      .sort()
      .map((key) => [key, params.getAll(key)])
  );
}

@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTooltipModule,
    MatSnackBarModule,
    ReportTabComponent,
    TagManageTabComponent
  ],
  styleUrls: ['./detail-view.component.css'],
  template: `
    <div class="detail">
      <div class="detail__header">
        <div class="detail__header__row">
          <button
            mat-button
            class="back-btn"
            aria-label="Go back"
            matTooltip="Back"
            (click)="goBack()"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
            <span class="back-label">Back</span>
          </button>
        </div>
        <mat-tab-group
          mat-stretch-tabs="true"
          dynamicHeight
          [selectedIndex]="selectedTabIndex"
        >
          <mat-tab label="Tag Snapshot">
            <app-tag-manage-tab [tagSpec]="tagSpec()"></app-tag-manage-tab>
          </mat-tab>
          <mat-tab label="Reports">
            <app-report-tab [context]="routeContext()"></app-report-tab>
          </mat-tab>
        </mat-tab-group>
        <br />
      </div>
    </div>
  `
})
export class DetailViewComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  routeContext = signal<ReportDetailRouteContext | undefined>(undefined);
  tagSpec = computed(() => toTagSpec(this.routeContext()?.spec));
  selectedTabIndex = 0;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const spec = data['spec'] as DataLayerSpec;
        const fileReports = (data['fileReports'] as FrontFileReport[] | null) ?? [];
        const video = data['video'] as { blob: Blob | undefined };
        const image = data['image'] as { blob: Blob | undefined };
        const recording = (data['recording'] as Recording | null) ?? null;
        const reportDetailsObject = data['reportDetails'] as
          | {
              testEvent: TestEvent;
              testEventDetails: TestEventDetail;
              testImage: TestImage;
            }
          | undefined;

        this.routeContext.set({
          projectSlug: (data['projectSlug'] as string | undefined) ?? '',
          eventId: (data['eventId'] as string | undefined) ?? '',
          spec,
          recording,
          reportDetails: buildFlattenedReportDetails(reportDetailsObject),
          videoBlob: video?.blob,
          imageBlob: image?.blob,
          fileReports,
          historyLinkCommands: ['..', 'buckets']
        });
      });

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
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private handleQueryParams(params: ParamMap) {
    const tab = params.get('tab');
    const snackbar = params.get('snackbar');

    if (tab?.toLowerCase() === 'reports') {
      this.selectedTabIndex = 1;
    }

    if (snackbar === 'missingRecording') {
      this.snackBar.openFromComponent(SnackBarComponent, {
        duration: 5000,
        data: 'Please add a Chrome Recording to this event before running tests.'
      });

      const queryParams: Params = { ...this.route.snapshot.queryParams };
      delete queryParams['snackbar'];
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl: true
      });
    }
  }
}
