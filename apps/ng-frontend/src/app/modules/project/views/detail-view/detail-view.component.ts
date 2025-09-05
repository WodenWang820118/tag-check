import { Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  FrontFileReport,
  IReportDetails,
  TagSpec,
  TestEvent,
  TestEventDetail,
  TestImage
} from '@utils';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportTabComponent } from '../../components/report-tab/report-tab.component';
import { TagManageTabComponent } from '../../components/tag-manage-tab/tag-manage-tab.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackBarComponent } from '../../../../shared/components/snackbar/snackbar.component';

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
          <!-- Title intentionally minimal to avoid duplication with card header -->
        </div>
        <mat-tab-group
          mat-stretch-tabs="true"
          dynamicHeight
          [selectedIndex]="selectedTabIndex"
        >
          <mat-tab label="Tag Snapshot">
            <app-tag-manage-tab [tagSpec]="tagSpec$()"></app-tag-manage-tab>
          </mat-tab>
          <mat-tab label="Reports">
            <app-report-tab
              [reportDetails]="reportDetails$()"
              [tagSpec]="tagSpec$()"
              [videoBlob]="videoBlob$()"
              [imageBlob]="imageBlob$()"
              [frontFileReport]="frontFileReport()"
            ></app-report-tab>
          </mat-tab>
        </mat-tab-group>
        <br />
      </div>
    </div>
  `
})
export class DetailViewComponent implements OnInit {
  reportDetails = signal<IReportDetails | undefined>(undefined);
  reportDetails$ = computed(() => this.reportDetails());
  tagSpec = signal<TagSpec | undefined>(undefined);
  tagSpec$ = computed(() => this.tagSpec());
  videoBlob = signal<Blob | null>(null);
  videoBlob$ = computed(() => this.videoBlob());
  imageBlob = signal<Blob | null>(null);
  imageBlob$ = computed(() => this.imageBlob());
  frontFileReport = signal([] as FrontFileReport[]);
  // testEventDetail$ moved into the ReportTabComponent
  selectedTabIndex = 0; // 0: Tag Snapshot, 1: Reports

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // react to route data
    this.route.data.subscribe((data) => {
      console.log('Route data:', data);
      const fileReports = data['fileReports'] as FrontFileReport[];
      const spec = data['spec'] as TagSpec;

      this.frontFileReport.set(fileReports);
      this.tagSpec.set(spec);

      const reportDetailsObject = data['reportDetails'] as {
        testEvent: TestEvent;
        testEventDetail: TestEventDetail;
        testImage: TestImage;
      };

      // Flatten the array of objects into a single object
      console.log('Report details object:', reportDetailsObject);
      const flattenedReportDetails: IReportDetails = {
        ...reportDetailsObject.testEvent,
        ...reportDetailsObject.testEventDetail,
        ...reportDetailsObject.testImage,
        position: 0,
        event: reportDetailsObject.testEvent.eventName,
        createdAt: new Date()
      };
      console.log('Flattened report details:', flattenedReportDetails);
      const video = data['video'] as { blob: Blob | null };
      const image = data['image'] as { blob: Blob | null };
      this.reportDetails.set(flattenedReportDetails);
      this.videoBlob.set(video.blob);
      this.imageBlob.set(image.blob);
    });

    // react to query params to select Reports tab and optionally show snackbar
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      const snackbar = params.get('snackbar');
      // select the Reports tab when requested
      if (tab && tab.toLowerCase() === 'reports') {
        this.selectedTabIndex = 1;
      }
      // show snackbar hint when navigating from add-recording prompt
      if (snackbar === 'missingRecording') {
        this.snackBar.openFromComponent(SnackBarComponent, {
          duration: 5000,
          data: 'Please add a Chrome Recording to this event before running tests.'
        });
        // Optionally remove the snackbar flag from URL to avoid showing again on refresh
        // by replacing current URL without reloading component
        const queryParams: Params = { ...this.route.snapshot.queryParams };
        delete queryParams['snackbar'];
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams,
          replaceUrl: true
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
