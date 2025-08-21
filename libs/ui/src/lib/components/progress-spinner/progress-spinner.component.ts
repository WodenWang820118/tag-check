import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

enum ProgressSpinnerColor {
  primary = 'primary',
  accent = 'accent',
  warn = 'warn'
}

@Component({
  selector: 'lib-progress-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="progress">
      <div class="progress__state">
        <mat-progress-spinner
          mode="determinate"
          [value]="getRatio()"
          [color]="color()"
          [diameter]="50"
          [strokeWidth]="10"
        ></mat-progress-spinner>
        <p>Parsed tags: {{ numParsedTags() }} / {{ numTotalTags() }}</p>
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
      }

      .progress__state {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1rem;
        flex: 1 1 0;
      }

      .progress__description {
        flex: 2 1 0;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressSpinnerComponent {
  numParsedTags = input<number | null>(null);
  numTotalTags = input<number | null>(null);
  color = input<ProgressSpinnerColor>(ProgressSpinnerColor.primary);

  getRatio() {
    const parsedTags = this.numParsedTags();
    const totalTags = this.numTotalTags();
    if (parsedTags === null || totalTags === null || totalTags === 0) return 0;
    return (parsedTags / totalTags) * 100;
  }
}
