import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  BatchItemStatus,
  BatchRunService
} from '../../services/batch-run/batch-run.service';

const STATUS_LABELS: Record<BatchItemStatus, string> = {
  pending: 'Waiting',
  running: 'Running',
  passed: 'Passed',
  partial: 'Partial',
  failed: 'Failed',
  error: 'Error',
  cancelled: 'Cancelled'
};

/** Progress and per-test outcome of the current or last batch run. */
@Component({
  selector: 'app-batch-run-panel',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (batch(); as run) {
      <section class="batch-run" data-testid="batch-run-panel">
        <div class="batch-run__header">
          <strong>Batch run</strong>
          <span data-testid="batch-run-progress">
            {{ batchRun.doneCount() }} / {{ run.items.length }}
          </span>
          @for (count of counts(); track count.label) {
            <span class="batch-run__count"
              >{{ count.label }} {{ count.value }}</span
            >
          }
          @if (batchRun.currentItem(); as current) {
            <span class="batch-run__current"
              >Running {{ current.eventName }}</span
            >
          }
          <span class="batch-run__spacer"></span>
          @if (batchRun.isRunning()) {
            <button
              mat-stroked-button
              data-testid="batch-run-cancel"
              (click)="batchRun.cancel()"
            >
              Cancel
            </button>
          }
          @if (batchRun.canResume()) {
            <button
              mat-stroked-button
              data-testid="batch-run-resume"
              (click)="batchRun.resume()"
            >
              Resume ({{ pendingCount() }} left)
            </button>
          }
          @if (!batchRun.isRunning()) {
            <button
              mat-button
              data-testid="batch-run-clear"
              (click)="batchRun.clear()"
            >
              Clear
            </button>
          }
        </div>
        <mat-progress-bar
          mode="determinate"
          [value]="percent()"
        ></mat-progress-bar>
        <details class="batch-run__items">
          <summary>Tests in this batch</summary>
          <ul>
            @for (item of run.items; track item.eventId) {
              <li [attr.data-testid]="'batch-run-item-' + item.eventName">
                <span class="batch-run__name">{{ item.eventName }}</span>
                <span>{{ label(item.status) }}</span>
                @if (item.message) {
                  <span class="batch-run__message">{{ item.message }}</span>
                }
              </li>
            }
          </ul>
        </details>
      </section>
    }
  `,
  styles: [
    `
      .batch-run {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      }
      .batch-run__header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }
      .batch-run__spacer {
        flex: 1;
      }
      .batch-run__count,
      .batch-run__current {
        opacity: 0.8;
      }
      .batch-run__items ul {
        margin: 0.5rem 0 0;
        padding-left: 1.25rem;
      }
      .batch-run__items li {
        display: flex;
        gap: 0.75rem;
      }
      .batch-run__name {
        min-width: 12rem;
        font-family: monospace;
      }
      .batch-run__message {
        opacity: 0.8;
      }
    `
  ]
})
export class BatchRunPanelComponent {
  protected readonly batchRun = inject(BatchRunService);
  protected readonly batch = this.batchRun.batch;

  protected readonly pendingCount = computed(
    () =>
      this.batch()?.items.filter((item) => item.status === 'pending').length ??
      0
  );

  protected readonly percent = computed(() => {
    const total = this.batch()?.items.length ?? 0;
    return total === 0 ? 0 : (this.batchRun.doneCount() / total) * 100;
  });

  /** Counts of the finished outcomes that occurred, in a fixed order. */
  protected readonly counts = computed(() => {
    const items = this.batch()?.items ?? [];
    const outcomes: BatchItemStatus[] = [
      'passed',
      'partial',
      'failed',
      'error',
      'cancelled'
    ];
    return outcomes
      .map((status) => ({
        label: STATUS_LABELS[status],
        value: items.filter((item) => item.status === status).length
      }))
      .filter((count) => count.value > 0);
  });

  protected label(status: BatchItemStatus): string {
    return STATUS_LABELS[status];
  }
}
