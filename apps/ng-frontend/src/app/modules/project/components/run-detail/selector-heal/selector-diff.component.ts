import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import type { SelectorChange } from './selector-heal';

/**
 * How saving changes a step's selectors: each added, kept or removed
 * selector on its own line, marked +, − or blank, with the change spelled
 * out for screen readers. When `selectable` is set, each added selector
 * can be left out of the save.
 */
@Component({
  selector: 'app-selector-diff',
  standalone: true,
  imports: [MatCheckboxModule],
  templateUrl: './selector-diff.component.html',
  styleUrls: ['./selector-diff.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectorDiffComponent {
  readonly changes = input.required<SelectorChange[]>();

  /** Lets each added selector be left out of the save. */
  readonly selectable = input(false);

  /** Added selectors the user has unticked. */
  readonly excluded = input<readonly string[]>([]);

  /** The added selector whose tick changed. */
  readonly toggle = output<string>();

  /** An added selector the user unticked, so it will not be saved. */
  excludedAdd(line: SelectorChange): boolean {
    return (
      this.selectable() &&
      line.change === 'add' &&
      this.excluded().includes(line.selector)
    );
  }

  /** The screen-reader name of a line. An unticked add is not saved. */
  prefix(line: SelectorChange): string {
    if (line.change === 'add') {
      return this.excludedAdd(line) ? 'Not saved:' : 'Added:';
    }
    return line.change === 'remove' ? 'Removed:' : 'Kept:';
  }
}
