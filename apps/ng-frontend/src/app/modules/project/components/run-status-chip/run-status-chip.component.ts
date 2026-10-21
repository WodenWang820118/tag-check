import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RunStatus, STATUS_BADGES } from '../report-detail.contracts';

const checkLabel = (passed: boolean | undefined) =>
  passed === true ? 'Passed' : 'Failed';

/**
 * One chip for the status of a test or a run: Passed, Partial, Failed,
 * Not run or Running. Its tooltip gives each check's result.
 */
@Component({
  selector: 'app-run-status-chip',
  standalone: true,
  imports: [MatChipsModule, MatIconModule, MatTooltipModule],
  template: `
    <mat-chip-set [attr.aria-label]="'Status: ' + badge().label">
      <mat-chip
        selected
        [color]="badge().color"
        [class]="'run-status run-status--' + status()"
        [matTooltip]="checks()"
      >
        <span class="run-status__content">
          <mat-icon inline aria-hidden="true">{{ badge().icon }}</mat-icon>
          <span>{{ badge().label }}</span>
        </span>
      </mat-chip>
    </mat-chip-set>
  `,
  styles: `
    .run-status__content {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .run-status--passed mat-icon {
      color: #2e7d32;
    }
    .run-status--partial mat-icon {
      color: #ef6c00;
    }
    .run-status--failed mat-icon {
      color: #c62828;
    }
    .run-status--notRun mat-icon,
    .run-status--running mat-icon {
      color: #757575;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RunStatusChipComponent {
  status = input.required<RunStatus | 'running'>();
  /** The data layer check, for the tooltip of a run that finished. */
  passed = input<boolean | undefined>();
  /** The request check, for the tooltip of a run that finished. */
  requestPassed = input<boolean | undefined>();

  readonly badge = computed(() => STATUS_BADGES[this.status()]);
  readonly checks = computed(() => {
    switch (this.status()) {
      case 'notRun':
        return 'Not run yet';
      case 'running':
        return 'Running';
      default:
        return `Data layer: ${checkLabel(this.passed())} · Request: ${checkLabel(this.requestPassed())}`;
    }
  });
}
