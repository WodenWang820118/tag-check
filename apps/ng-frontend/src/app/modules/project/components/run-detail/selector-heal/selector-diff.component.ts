import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { SelectorChange } from './selector-heal';

/**
 * How saving changes a step's selectors: each added, kept or removed
 * selector on its own line, marked +, − or blank, with the change spelled
 * out for screen readers.
 */
@Component({
  selector: 'app-selector-diff',
  standalone: true,
  templateUrl: './selector-diff.component.html',
  styleUrls: ['./selector-diff.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectorDiffComponent {
  readonly changes = input.required<SelectorChange[]>();
}
