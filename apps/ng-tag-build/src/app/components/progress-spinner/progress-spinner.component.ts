import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SharedModule } from '../../shared.module';

enum ProgressSpinnerColor {
  primary = 'primary',
  accent = 'accent',
  warn = 'warn',
}

@Component({
  selector: 'app-progress-spinner',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div class="progress">
      <div class="progress__state">
        <mat-progress-spinner
          mode="determinate"
          [value]="getRatio()"
          [color]="color"
          [diameter]="50"
          [strokeWidth]="10"
        ></mat-progress-spinner>
        <p>Parsed tags: {{ numParsedTags }} / {{ numTotalTags }}</p>
      </div>
      <div class="progress__description">
        <p>
          This progress bar shows the number of successfully parsed events.
          Failed events are listed at the bottom. Otherwise, the raw data might
          be irrelevent to specs.
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .progress {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;

        &__state {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1rem;
          flex: 1 1 0;
        }

        &__description {
          flex: 2 1 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressSpinnerComponent {
  @Input() numParsedTags: number | null = null;
  @Input() numTotalTags: number | null = null;
  @Input() color: ProgressSpinnerColor = ProgressSpinnerColor.primary;

  getRatio() {
    if (this.numParsedTags === null || this.numTotalTags === null) return;
    return (this.numParsedTags / this.numTotalTags) * 100;
  }
}
