import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  NgZone,
  signal,
  untracked
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { apiErrorMessage } from '../../../../shared/services/api/http-error.utils';
import {
  ScheduleJson,
  SchedulesService
} from '../../../../shared/services/api/schedules/schedules.service';
import { InformationDialogComponent } from '../../../../shared/components/information-dialog/information-dialog.component';
import {
  ScheduleDialogComponent,
  ScheduleDialogData
} from '../../components/schedule-dialog/schedule-dialog.component';
import { scheduleSummary } from '../../components/schedule-dialog/schedule-summary';

/** Read the list again this long after the earliest next run, once it ran. */
const AFTER_RUN_MS = 5000;
/** The longest wait before the list is read again. */
const MAX_REFRESH_MS = 60 * 60 * 1000;

/**
 * The project's schedules: each one's tests, preset, next and last run, an
 * enabled toggle, Run now, Edit and Delete. Schedules are created from the
 * Tests page (Schedule selected). The list is read again after the earliest
 * next run, so its last run shows without a reload.
 */
@Component({
  selector: 'app-schedules-view',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="schedules-view">
      <section class="mat-elevation-z4 schedules" data-testid="schedules-page">
        <header class="schedules__header">
          <h2>Schedules</h2>
          <p>
            Scheduled runs are headless and run while Tag Check is running (it
            keeps running in the tray when the window is closed). Their results
            appear in Reports.
          </p>
        </header>
        @if (loadError(); as message) {
          <p class="schedules__error" data-testid="schedules-error">
            {{ message }}
          </p>
        }
        @if (schedules(); as rows) {
          @if (rows.length === 0) {
            <p class="schedules__empty" data-testid="schedules-empty">
              No schedules yet. On the Tests page, select tests and choose
              Schedule selected.
            </p>
          } @else {
            <table mat-table [dataSource]="rows" data-testid="schedules-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>
              <ng-container matColumnDef="tests">
                <th mat-header-cell *matHeaderCellDef>Tests</th>
                <td mat-cell *matCellDef="let row">
                  {{ row.eventIds.length }}
                </td>
              </ng-container>
              <ng-container matColumnDef="preset">
                <th mat-header-cell *matHeaderCellDef>Repeats</th>
                <td
                  mat-cell
                  *matCellDef="let row"
                  [attr.data-testid]="'schedules-preset-' + row.id"
                >
                  {{ summary(row) }}
                </td>
              </ng-container>
              <ng-container matColumnDef="nextRun">
                <th mat-header-cell *matHeaderCellDef>Next run</th>
                <td
                  mat-cell
                  *matCellDef="let row"
                  [attr.data-testid]="'schedules-next-run-' + row.id"
                >
                  {{ row.nextRunAt ? (row.nextRunAt | date: 'medium') : '—' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="lastRun">
                <th mat-header-cell *matHeaderCellDef>Last run</th>
                <td
                  mat-cell
                  *matCellDef="let row"
                  [attr.data-testid]="'schedules-last-run-' + row.id"
                >
                  {{
                    row.lastRunAt ? (row.lastRunAt | date: 'medium') : 'Never'
                  }}
                </td>
              </ng-container>
              <ng-container matColumnDef="enabled">
                <th mat-header-cell *matHeaderCellDef>Enabled</th>
                <td mat-cell *matCellDef="let row">
                  <mat-slide-toggle
                    [checked]="row.enabled"
                    [attr.data-testid]="'schedules-enabled-' + row.id"
                    [aria-label]="'Enable ' + row.name"
                    (change)="setEnabled(row, $event.checked)"
                  ></mat-slide-toggle>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="schedules__actions">
                  <button
                    mat-icon-button
                    matTooltip="Run now"
                    aria-label="Run now"
                    [attr.data-testid]="'schedules-run-now-' + row.id"
                    (click)="runNow(row)"
                  >
                    <mat-icon>play_arrow</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="Edit"
                    aria-label="Edit"
                    [attr.data-testid]="'schedules-edit-' + row.id"
                    (click)="edit(row)"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="Delete"
                    aria-label="Delete"
                    [attr.data-testid]="'schedules-delete-' + row.id"
                    (click)="remove(row)"
                  >
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr
                mat-row
                *matRowDef="let row; columns: columns"
                [attr.data-testid]="'schedules-row-' + row.id"
              ></tr>
            </table>
          }
        }
      </section>
    </div>
  `,
  styles: `
    .schedules-view {
      padding: 5rem clamp(1rem, 8vw, 10rem) 2rem clamp(1rem, 16vw, 20rem);
    }
    .schedules {
      padding-bottom: 0.5rem;
    }
    .schedules__header {
      padding: 1rem 1rem 0;
    }
    .schedules__header h2 {
      margin: 0 0 0.25rem;
    }
    .schedules__header p,
    .schedules__empty {
      margin: 0 0 1rem;
      opacity: 0.8;
    }
    .schedules__empty,
    .schedules__error {
      padding: 0 1rem;
    }
    .schedules__error {
      color: var(--mat-sys-error, #b3261e);
    }
    .schedules__actions {
      white-space: nowrap;
      text-align: end;
    }
    table {
      width: 100%;
    }
  `
})
export class SchedulesViewComponent {
  private readonly schedulesService = inject(SchedulesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly ngZone = inject(NgZone);

  protected readonly columns = [
    'name',
    'tests',
    'preset',
    'nextRun',
    'lastRun',
    'enabled',
    'actions'
  ];
  /** The project's schedules; null until they are read. */
  protected readonly schedules = signal<ScheduleJson[] | null>(null);
  protected readonly loadError = signal<string | null>(null);
  // The page is a child of the project's page, whose route has the slug.
  private readonly projectSlug = toSignal(
    (this.route.parent ?? this.route).paramMap.pipe(
      map((params) => params.get('projectSlug'))
    ),
    { initialValue: null }
  );

  constructor() {
    effect(() => {
      const projectSlug = this.projectSlug();
      if (projectSlug) {
        untracked(() => this.load(projectSlug));
      }
    });
    // Once the earliest schedule has run, read the list again so that its
    // last and next run show.
    effect((onCleanup) => {
      const projectSlug = this.projectSlug();
      const next = (this.schedules() ?? [])
        .map((schedule) =>
          schedule.enabled && schedule.nextRunAt
            ? Date.parse(schedule.nextRunAt)
            : Number.NaN
        )
        .filter((time) => Number.isFinite(time))
        .sort((a, b) => a - b)[0];
      if (!projectSlug || next === undefined) {
        return;
      }
      const delay = Math.min(
        Math.max(next - Date.now(), 0) + AFTER_RUN_MS,
        MAX_REFRESH_MS
      );
      // Outside Angular's zone, so that a pending timer of up to an hour
      // does not keep the app from becoming stable.
      const timer = this.ngZone.runOutsideAngular(() =>
        setTimeout(() => this.ngZone.run(() => this.load(projectSlug)), delay)
      );
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected summary(schedule: ScheduleJson): string {
    return scheduleSummary(schedule);
  }

  protected async setEnabled(
    schedule: ScheduleJson,
    enabled: boolean
  ): Promise<void> {
    await this.save(
      schedule,
      this.schedulesService.update(schedule.projectSlug, schedule.id, {
        enabled
      })
    );
  }

  protected async runNow(schedule: ScheduleJson): Promise<void> {
    try {
      const batch = await firstValueFrom(
        this.schedulesService.runNow(schedule.projectSlug, schedule.id)
      );
      this.notify(
        `Queued "${schedule.name}" (${batch.items.length} ${
          batch.items.length === 1 ? 'test' : 'tests'
        }, headless). The Tests page shows its progress.`
      );
    } catch (error) {
      console.error(error);
      this.notify(apiErrorMessage(error, 'The schedule could not be run.'));
    }
  }

  protected edit(schedule: ScheduleJson): void {
    const data: ScheduleDialogData = {
      projectSlug: schedule.projectSlug,
      eventIds: schedule.eventIds,
      schedule
    };
    this.dialog
      .open<ScheduleDialogComponent, ScheduleDialogData, ScheduleJson>(
        ScheduleDialogComponent,
        { data }
      )
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.replace(saved);
        }
      });
  }

  protected remove(schedule: ScheduleJson): void {
    this.dialog
      .open(InformationDialogComponent, {
        data: {
          title: 'Delete schedule',
          contents: `Delete the schedule "${schedule.name}"? Its past runs stay in Reports.`,
          action: 'Delete',
          actionColor: 'warn'
        }
      })
      .afterClosed()
      .subscribe((confirmed: unknown) => {
        if (confirmed === true) {
          void this.delete(schedule);
        }
      });
  }

  private async delete(schedule: ScheduleJson): Promise<void> {
    try {
      await firstValueFrom(
        this.schedulesService.delete(schedule.projectSlug, schedule.id)
      );
      this.schedules.update(
        (rows) => rows?.filter((row) => row.id !== schedule.id) ?? null
      );
    } catch (error) {
      console.error(error);
      this.notify(apiErrorMessage(error, 'The schedule could not be deleted.'));
    }
  }

  private load(projectSlug: string): void {
    this.schedulesService.list(projectSlug).subscribe({
      next: (rows) => {
        this.loadError.set(null);
        this.schedules.set(rows);
      },
      error: (error: unknown) => {
        console.error(error);
        this.loadError.set(
          apiErrorMessage(error, 'The schedules could not be read.')
        );
      }
    });
  }

  private async save(
    schedule: ScheduleJson,
    request: ReturnType<SchedulesService['update']>
  ): Promise<void> {
    try {
      this.replace(await firstValueFrom(request));
    } catch (error) {
      console.error(error);
      // The toggle shows the value it had.
      this.replace({ ...schedule });
      this.notify(apiErrorMessage(error, 'The schedule could not be saved.'));
    }
  }

  private replace(saved: ScheduleJson): void {
    this.schedules.update(
      (rows) =>
        rows?.map((row) => (row.id === saved.id ? saved : row)) ?? [saved]
    );
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 6000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
}
