import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  Params,
  Router
} from '@angular/router';
import { distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { VariableConfig } from '@utils';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportTabComponent } from '../../components/report-tab/report-tab.component';
import { TagManageTabComponent } from '../../components/tag-manage-tab/tag-manage-tab.component';
import { SnackBarComponent } from '../../../../shared/components/snackbar/snackbar.component';
import { ProjectService } from '../../../../shared/services/api/project-info/project-info.service';
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
  changeDetection: ChangeDetectionStrategy.Eager,
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
            <app-tag-manage-tab
              [tagSpec]="tagSpec()"
              [variables]="variables()"
            ></app-tag-manage-tab>
          </mat-tab>
          <mat-tab label="Latest result">
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly projectService = inject(ProjectService);

  /** Loaded by reportPageResolver. */
  routeContext = toSignal(
    this.route.data.pipe(
      map((data) => data['page'] as ReportDetailRouteContext | undefined)
    )
  );
  tagSpec = computed(() => toTagSpec(this.routeContext()?.spec));
  /**
   * The project's container variables, which resolve the tag's references.
   * They load after the page shows; until then the tab shows the references.
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
  selectedTabIndex = 0;

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
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl: true
      });
    }
  }
}
