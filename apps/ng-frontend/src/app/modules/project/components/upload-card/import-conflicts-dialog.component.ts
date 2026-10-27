import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import {
  GtmImportConflict,
  GtmImportResolution,
  keepBothTestName
} from '@utils';

/** Conflicts from `POST gtm-parser/preview`, as that endpoint returns them. */
export type ImportConflictsDialogData = {
  conflicts: GtmImportConflict[];
};

/** One choice per tag name. Cancelling closes with nothing. */
export type ImportConflictsDialogResult = Record<string, GtmImportResolution>;

/**
 * The name a kept-both test would get from the tag names this dialog can
 * see. The import still picks the next free number when the project already
 * has that name.
 */
export function predictedKeepBothNames(
  conflicts: readonly GtmImportConflict[],
  choices: Readonly<Record<string, GtmImportResolution>>
): Map<string, string> {
  const taken = new Set(conflicts.map((conflict) => conflict.tagName));
  const names = new Map<string, string>();
  for (const conflict of conflicts) {
    const name = keepBothTestName(conflict.tagName, taken);
    names.set(conflict.tagName, name);
    if (choices[conflict.tagName] === 'keepBoth') {
      taken.add(name);
    }
  }
  return names;
}

function initialChoices(
  conflicts: readonly GtmImportConflict[]
): Record<string, GtmImportResolution> {
  const choices: Record<string, GtmImportResolution> = {};
  for (const conflict of conflicts) {
    choices[conflict.tagName] = 'update';
  }
  return choices;
}

/**
 * Asks, for each tag whose event name changed, whether to update the existing
 * test or keep it and add another. Update is selected until the user says
 * otherwise. Cancel closes with nothing and imports nothing.
 */
@Component({
  selector: 'app-import-conflicts-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './import-conflicts-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportConflictsDialogComponent {
  readonly data = inject<ImportConflictsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<
      MatDialogRef<
        ImportConflictsDialogComponent,
        ImportConflictsDialogResult | undefined
      >
    >(MatDialogRef);

  readonly choices = signal<Record<string, GtmImportResolution>>(
    initialChoices(this.data.conflicts)
  );

  private readonly predicted = computed(() =>
    predictedKeepBothNames(this.data.conflicts, this.choices())
  );

  protected resolutionFor(tagName: string): GtmImportResolution {
    return this.choices()[tagName] ?? 'update';
  }

  protected nameFor(tagName: string): string {
    return (
      this.predicted().get(tagName) ?? keepBothTestName(tagName, new Set())
    );
  }

  protected choose(tagName: string, resolution: GtmImportResolution): void {
    this.choices.update((current) => ({ ...current, [tagName]: resolution }));
  }

  protected confirm(): void {
    const resolutions: ImportConflictsDialogResult = {};
    for (const conflict of this.data.conflicts) {
      resolutions[conflict.tagName] = this.resolutionFor(conflict.tagName);
    }
    this.dialogRef.close(resolutions);
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
