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
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, firstValueFrom, forkJoin, type Subscription } from 'rxjs';
import type {
  AiAssistResponse,
  ElementCandidate,
  SelectorSuggestion,
  SelectorSuggestionsResponse,
  SelectorTrialResponse,
  StepFailureContext
} from '@utils';
import { AiModelNoticeComponent } from '../../../../../shared/components/ai-model-notice/ai-model-notice.component';
import { AiAssistService } from '../../../../../shared/services/api/ai-assist/ai-assist.service';
import { apiErrorMessage } from '../../../../../shared/services/api/http-error.utils';
import { RecordingService } from '../../../../../shared/services/api/recording/recording.service';
import { SelectorDiffComponent } from './selector-diff.component';
import {
  chosenSelectors,
  selectorChanges,
  withoutExcludedSelectors,
  withStepSelectors
} from './selector-heal';

/** The run whose failed step the drawer finds a replacement for. */
export type SelectorHealDialogData = {
  projectSlug: string;
  eventId: string;
  runId: number;
  /** The step as the page names it, such as `Step 5 · Click "Add to cart"`. */
  stepLabel: string;
};

/** Closes with the latest trial run, for the page to show. */
export type SelectorHealDialogResult = { runId: number } | undefined;

type Trial =
  | { suggestion: SelectorSuggestion; status: 'running' }
  | {
      suggestion: SelectorSuggestion;
      status: 'done';
      result: SelectorTrialResponse;
    }
  | { suggestion: SelectorSuggestion; status: 'error'; message: string };

/**
 * The side panel that finds a replacement for a step that could not find
 * its element. It says whether the local model can be asked, shows what
 * the run saw, asks the model, and lists its suggestions: each a page
 * element the run recorded, with selectors that matched only it (facts)
 * and the model's reason (not checked). A trial runs the test with a
 * suggestion; the recording changes only when it is saved.
 */
@Component({
  selector: 'app-selector-heal-dialog',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    AiModelNoticeComponent,
    SelectorDiffComponent
  ],
  templateUrl: './selector-heal-dialog.component.html',
  styleUrls: ['./selector-heal-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectorHealDialogComponent implements OnInit {
  readonly data = inject<SelectorHealDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<SelectorHealDialogComponent, SelectorHealDialogResult>>(
      MatDialogRef
    );
  private readonly aiAssist = inject(AiAssistService);
  private readonly recordings = inject(RecordingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly ai = signal<AiAssistResponse | null>(null);
  readonly context = signal<StepFailureContext | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly checking = signal(false);
  readonly asking = signal(false);
  readonly askError = signal<string | null>(null);
  readonly answer = signal<SelectorSuggestionsResponse | null>(null);
  private readonly dismissed = signal<number[]>([]);
  readonly trial = signal<Trial | null>(null);
  readonly keepOld = signal(false);
  /** New selectors the user unticked, left out of the save. */
  readonly excluded = signal<string[]>([]);
  readonly saving = signal(false);

  private asked?: Subscription;
  private trialRunId: number | null = null;

  readonly ready = computed(() => {
    const ai = this.ai();
    return ai?.settings.enabled === true && ai.readiness.kind === 'ready';
  });

  readonly suggestions = computed(() =>
    (this.answer()?.suggestions ?? []).filter(
      (suggestion) => !this.dismissed().includes(suggestion.candidate.index)
    )
  );

  /** The suggestion's selectors the user left ticked, in that order. */
  readonly chosen = computed(() =>
    chosenSelectors(
      this.trial()?.suggestion.candidate.selectors ?? [],
      this.excluded()
    )
  );

  /** How the step's selectors change with the suggestion on trial. */
  readonly changes = computed(() => {
    const trial = this.trial();
    const context = this.context();
    return trial && context
      ? selectorChanges(
          context.selectors.map(({ selector }) => selector),
          trial.suggestion.candidate.selectors,
          this.keepOld()
        )
      : [];
  });

  /** The page the step gave up on, without its origin. */
  readonly pagePath = computed(() => {
    const url = this.context()?.url;
    if (!url) return '';
    try {
      const { pathname, search } = new URL(url);
      return pathname + search;
    } catch {
      return url;
    }
  });

  /**
   * A trial passes on both checks, or on the dataLayer check alone when it
   * made no request check (Request Check off).
   */
  trialPassed(result: SelectorTrialResponse): boolean {
    return (
      result.passed && (result.requestPassed || result.requestChecked === false)
    );
  }

  ngOnInit(): void {
    this.dialogRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.close());
    this.dialogRef
      .keydownEvents()
      .pipe(
        filter((event) => event.key === 'Escape'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.close());
    this.load();
  }

  /** Reads the model's state and what the run saw, then asks when ready. */
  load(): void {
    forkJoin({
      ai: this.aiAssist.get(),
      context: this.aiAssist.getStepFailure(
        this.data.projectSlug,
        this.data.eventId,
        this.data.runId
      )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ ai, context }) => {
          this.ai.set(ai);
          this.context.set(context);
          if (this.ready()) {
            this.ask();
          }
        },
        error: (error: unknown) =>
          this.loadError.set(
            apiErrorMessage(error, 'What this run saw could not be read.')
          )
      });
  }

  /** Asks Ollama again, then the model once it is ready. */
  recheck(): void {
    this.checking.set(true);
    this.aiAssist
      .get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ai) => {
          this.ai.set(ai);
          this.checking.set(false);
          if (this.ready() && this.context() && !this.answer()) {
            this.ask();
          }
        },
        error: () => this.checking.set(false)
      });
  }

  ask(): void {
    this.asked?.unsubscribe();
    this.asking.set(true);
    this.askError.set(null);
    this.dismissed.set([]);
    this.asked = this.aiAssist
      .suggest(this.data.projectSlug, this.data.eventId, this.data.runId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (answer) => {
          this.answer.set(answer);
          this.asking.set(false);
        },
        error: (error: unknown) => {
          this.askError.set(
            apiErrorMessage(error, 'The model could not be asked. Try again.')
          );
          this.asking.set(false);
        }
      });
  }

  cancel(): void {
    this.asked?.unsubscribe();
    this.asking.set(false);
  }

  /** A candidate's name, or its tag for one without a name. */
  nameOf(candidate: ElementCandidate): string {
    return candidate.name || `<${candidate.tag}>`;
  }

  dismiss(suggestion: SelectorSuggestion): void {
    this.dismissed.update((indexes) => [
      ...indexes,
      suggestion.candidate.index
    ]);
  }

  /** Runs the test with the suggestion's selectors for the failed step. */
  tryIt(suggestion: SelectorSuggestion): void {
    const context = this.context();
    if (!context) return;
    this.keepOld.set(false);
    this.excluded.set([]);
    this.trial.set({ suggestion, status: 'running' });
    this.aiAssist
      .trial(this.data.projectSlug, this.data.eventId, {
        stepIndex: context.stepIndex,
        selectors: suggestion.candidate.selectors
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.trialRunId = result.runId;
          this.trial.set({ suggestion, status: 'done', result });
        },
        error: (error: unknown) =>
          this.trial.set({
            suggestion,
            status: 'error',
            message: apiErrorMessage(error, 'The trial run did not finish.')
          })
      });
  }

  backToSuggestions(): void {
    this.trial.set(null);
    this.excluded.set([]);
  }

  /** Ticks or unticks one new selector for the save. */
  toggleExcluded(selector: string): void {
    this.excluded.update((current) =>
      current.includes(selector)
        ? current.filter((item) => item !== selector)
        : [...current, selector]
    );
  }

  /** Writes the suggestion's selectors into the step of the recording. */
  async save(): Promise<void> {
    const trial = this.trial();
    const context = this.context();
    const selectors = this.chosen();
    if (!trial || !context || selectors.length === 0) return;
    this.saving.set(true);
    try {
      const recording = await firstValueFrom(
        this.recordings.getRecordingDetails(
          this.data.projectSlug,
          this.data.eventId
        )
      );
      await firstValueFrom(
        this.recordings.updateRecording(
          this.data.projectSlug,
          this.data.eventId,
          withoutExcludedSelectors(
            withStepSelectors(
              recording,
              context.stepIndex,
              selectors,
              this.keepOld()
            ),
            context.stepIndex,
            this.excluded()
          )
        )
      );
      this.snackBar.open(
        `Step ${context.stepIndex + 1} now waits for the new selectors.`,
        'Close',
        { duration: 5000 }
      );
      this.close();
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

  close(): void {
    this.asked?.unsubscribe();
    this.dialogRef.close(
      this.trialRunId === null ? undefined : { runId: this.trialRunId }
    );
  }
}
