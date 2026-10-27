import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import {
  describeFallbackMatch,
  type Recording,
  type StepFallback
} from '@utils';
import { apiErrorMessage } from '../../../../../shared/services/api/http-error.utils';
import { RecordingService } from '../../../../../shared/services/api/recording/recording.service';
import { SelectorDiffComponent } from './selector-diff.component';
import {
  chosenSelectors,
  selectorChanges,
  selectorGroupText,
  withoutExcludedSelectors,
  withStepSelectors
} from './selector-heal';

/** The fallback a run's step continued with, to save into the recording. */
export type SaveFallbackDialogData = {
  projectSlug: string;
  eventId: string;
  fallback: StepFallback;
  /** The step as the page names it, such as `Step 5 · Click "Add to cart"`. */
  stepLabel: string;
};

/** Closes with true once the recording was saved. */
export type SaveFallbackDialogResult = boolean | undefined;

/**
 * Shows how saving a fallback selector changes its step's selectors, then
 * writes it into the recording: the next runs wait for it first, without
 * needing the fallback.
 */
@Component({
  selector: 'app-save-fallback-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    SelectorDiffComponent
  ],
  templateUrl: './save-fallback-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaveFallbackDialogComponent implements OnInit {
  readonly data = inject<SaveFallbackDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<SaveFallbackDialogComponent, SaveFallbackDialogResult>>(
      MatDialogRef
    );
  private readonly recordings = inject(RecordingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly recording = signal<Recording | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly keepOld = signal(false);
  /** New selectors the user unticked, left out of the save. */
  readonly excluded = signal<string[]>([]);
  readonly saving = signal(false);

  readonly reason = describeFallbackMatch(this.data.fallback);

  /** The step's selectors as recorded now, as the diff lists them. */
  private readonly recorded = computed(() =>
    (
      this.recording()?.steps?.[this.data.fallback.stepIndex]?.selectors ?? []
    ).map(selectorGroupText)
  );

  /** The fallback selectors the user left ticked, in the fallback's order. */
  readonly chosen = computed(() =>
    chosenSelectors(this.data.fallback.selectors, this.excluded())
  );

  /**
   * Whether the step already waits for the first chosen selector. With
   * nothing unticked, that is the fallback's first selector.
   */
  readonly alreadySaved = computed(() => {
    const first = this.chosen()[0];
    return first !== undefined && first === this.recorded()[0];
  });

  readonly changes = computed(() =>
    selectorChanges(
      this.recorded(),
      this.data.fallback.selectors,
      this.keepOld()
    )
  );

  ngOnInit(): void {
    this.recordings
      .getRecordingDetails(this.data.projectSlug, this.data.eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (recording) => this.recording.set(recording),
        error: (error: unknown) =>
          this.loadError.set(
            apiErrorMessage(error, 'The recording could not be read.')
          )
      });
  }

  /** Ticks or unticks one new selector for the save. */
  toggleExcluded(selector: string): void {
    this.excluded.update((current) =>
      current.includes(selector)
        ? current.filter((item) => item !== selector)
        : [...current, selector]
    );
  }

  /** Writes the fallback's selectors into the step of the recording. */
  async save(): Promise<void> {
    const recording = this.recording();
    const selectors = this.chosen();
    if (!recording || selectors.length === 0) return;
    const { fallback } = this.data;
    this.saving.set(true);
    try {
      await firstValueFrom(
        this.recordings.updateRecording(
          this.data.projectSlug,
          this.data.eventId,
          withoutExcludedSelectors(
            withStepSelectors(
              recording,
              fallback.stepIndex,
              selectors,
              this.keepOld()
            ),
            fallback.stepIndex,
            this.excluded()
          )
        )
      );
      this.snackBar.open(
        `Step ${fallback.stepIndex + 1} now waits for the fallback selector.`,
        'Close',
        { duration: 5000 }
      );
      this.dialogRef.close(true);
    } catch (error) {
      this.snackBar.open(
        apiErrorMessage(error, 'The recording could not be saved.'),
        'Close',
        { duration: 5000 }
      );
    } finally {
      this.saving.set(false);
    }
  }
}
