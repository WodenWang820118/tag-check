import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  computeNextRunAt,
  SCHEDULE_NAME_MAX_LENGTH,
  ScheduleKind,
  ScheduleRequest,
  validateSchedulePreset
} from '@utils';
import { apiErrorMessage } from '../../../../shared/services/api/http-error.utils';
import {
  ScheduleJson,
  SchedulesService
} from '../../../../shared/services/api/schedules/schedules.service';
import { WEEKDAYS } from './schedule-summary';

/**
 * What the schedule dialog edits: a new schedule of the given tests, or an
 * existing schedule (whose tests stay as they are).
 */
export type ScheduleDialogData = {
  projectSlug: string;
  eventIds: string[];
  schedule?: ScheduleJson;
};

const KINDS: readonly { kind: ScheduleKind; label: string; testId: string }[] =
  [
    { kind: 'daily', label: 'Daily', testId: 'daily' },
    { kind: 'weekly', label: 'Weekly', testId: 'weekly' },
    { kind: 'everyHours', label: 'Every N hours', testId: 'every-hours' }
  ];

/**
 * Creates or edits a schedule: a name, a preset (daily or weekly at a time,
 * or every N hours) and whether it is enabled. It shows when the preset
 * runs next, and closes with the saved schedule.
 */
@Component({
  selector: 'app-schedule-dialog',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>
      {{ data.schedule ? 'Edit schedule' : 'Schedule tests' }}
    </h2>
    <mat-dialog-content class="schedule-dialog" data-testid="schedules-dialog">
      <p class="schedule-dialog__tests">
        {{ data.eventIds.length }}
        {{ data.eventIds.length === 1 ? 'test' : 'tests' }}
      </p>
      <mat-form-field appearance="outline" class="schedule-dialog__field">
        <mat-label>Name</mat-label>
        <input
          matInput
          required
          [maxlength]="nameMaxLength"
          data-testid="schedules-dialog-name"
          [(ngModel)]="name"
        />
      </mat-form-field>

      <mat-button-toggle-group
        aria-label="Repeat"
        [value]="kind()"
        (change)="kind.set($event.value)"
      >
        @for (option of kinds; track option.kind) {
          <mat-button-toggle
            [value]="option.kind"
            [attr.data-testid]="'schedules-dialog-kind-' + option.testId"
            >{{ option.label }}</mat-button-toggle
          >
        }
      </mat-button-toggle-group>

      @if (kind() === 'everyHours') {
        <mat-form-field appearance="outline" class="schedule-dialog__field">
          <mat-label>Hours</mat-label>
          <input
            matInput
            type="number"
            min="1"
            max="24"
            step="1"
            data-testid="schedules-dialog-hours"
            [(ngModel)]="everyHours"
          />
          <mat-hint>From 1 to 24</mat-hint>
        </mat-form-field>
      } @else {
        <mat-form-field appearance="outline" class="schedule-dialog__field">
          <mat-label>Time</mat-label>
          <input
            matInput
            type="time"
            data-testid="schedules-dialog-time"
            [(ngModel)]="time"
          />
        </mat-form-field>
      }

      @if (kind() === 'weekly') {
        <div class="schedule-dialog__weekdays" role="group" aria-label="Days">
          @for (weekday of weekdays; track weekday.day) {
            <mat-checkbox
              [checked]="days().includes(weekday.day)"
              (change)="toggleDay(weekday.day, $event.checked)"
              [attr.data-testid]="'schedules-dialog-weekday-' + weekday.testId"
              >{{ weekday.label }}</mat-checkbox
            >
          }
        </div>
      }

      <mat-slide-toggle
        data-testid="schedules-dialog-enabled"
        [checked]="enabled()"
        (change)="enabled.set($event.checked)"
        >Enabled</mat-slide-toggle
      >

      <p class="schedule-dialog__next" data-testid="schedules-dialog-next-run">
        @if (validation(); as result) {
          @if (!result.ok) {
            <span class="schedule-dialog__error">{{ result.error }}</span>
          } @else if (nextRunAt(); as next) {
            Next run: {{ next | date: 'EEE, MMM d, y, HH:mm' }}
          } @else {
            Disabled: it does not run until it is enabled.
          }
        }
      </p>
      <p class="schedule-dialog__note" data-testid="schedules-dialog-note">
        Scheduled runs are headless and run while Tag Check is running (it keeps
        running in the tray when the window is closed).
      </p>
      @if (saveError(); as message) {
        <p class="schedule-dialog__error" data-testid="schedules-dialog-error">
          {{ message }}
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        mat-button
        type="button"
        data-testid="schedules-dialog-cancel"
        (click)="dialogRef.close()"
      >
        Cancel
      </button>
      <button
        mat-flat-button
        type="button"
        data-testid="schedules-dialog-save"
        [disabled]="!canSave()"
        (click)="save()"
      >
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .schedule-dialog {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-width: min(28rem, 80vw);
    }
    .schedule-dialog__field {
      width: 100%;
    }
    .schedule-dialog__weekdays {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    .schedule-dialog__tests,
    .schedule-dialog__note {
      margin: 0;
      opacity: 0.8;
    }
    .schedule-dialog__next {
      margin: 0;
      font-weight: 500;
    }
    .schedule-dialog__error {
      margin: 0;
      color: var(--mat-sys-error, #b3261e);
    }
  `
})
export class ScheduleDialogComponent {
  protected readonly data = inject<ScheduleDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef =
    inject<MatDialogRef<ScheduleDialogComponent, ScheduleJson>>(MatDialogRef);
  private readonly schedulesService = inject(SchedulesService);

  protected readonly kinds = KINDS;
  protected readonly weekdays = WEEKDAYS;
  protected readonly nameMaxLength = SCHEDULE_NAME_MAX_LENGTH;

  protected readonly name = signal(this.data.schedule?.name ?? '');
  protected readonly kind = signal<ScheduleKind>(
    this.data.schedule?.kind ?? 'daily'
  );
  protected readonly time = signal(this.data.schedule?.time ?? '09:00');
  protected readonly days = signal<number[]>(
    this.data.schedule?.weekdays ?? [new Date().getDay()]
  );
  protected readonly everyHours = signal<number | null>(
    this.data.schedule?.everyHours ?? 6
  );
  protected readonly enabled = signal(this.data.schedule?.enabled ?? true);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  /** The preset, checked as the API checks it. */
  protected readonly validation = computed(() =>
    validateSchedulePreset({
      kind: this.kind(),
      time: this.time(),
      weekdays: this.days(),
      everyHours: this.everyHours()
    })
  );

  /** When the preset runs next from now; null while it is disabled. */
  protected readonly nextRunAt = computed(() => {
    const result = this.validation();
    return result.ok && this.enabled()
      ? computeNextRunAt(result.preset, new Date())
      : null;
  });

  protected readonly canSave = computed(
    () =>
      !this.saving() &&
      this.validation().ok &&
      this.name().trim() !== '' &&
      this.name().trim().length <= SCHEDULE_NAME_MAX_LENGTH
  );

  protected toggleDay(day: number, checked: boolean): void {
    this.days.update((days) =>
      checked ? [...days, day] : days.filter((other) => other !== day)
    );
  }

  protected async save(): Promise<void> {
    const result = this.validation();
    if (!result.ok || !this.canSave()) {
      return;
    }
    const request: ScheduleRequest = {
      name: this.name().trim(),
      eventIds: this.data.eventIds,
      ...result.preset,
      enabled: this.enabled()
    };
    const { projectSlug, schedule } = this.data;
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const saved = await firstValueFrom(
        schedule
          ? this.schedulesService.update(projectSlug, schedule.id, request)
          : this.schedulesService.create(projectSlug, request)
      );
      this.dialogRef.close(saved);
    } catch (error) {
      console.error(error);
      this.saveError.set(
        apiErrorMessage(error, 'The schedule could not be saved.')
      );
    } finally {
      this.saving.set(false);
    }
  }
}
