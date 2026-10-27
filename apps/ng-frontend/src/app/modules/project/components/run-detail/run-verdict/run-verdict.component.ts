import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  getCheckStatus,
  summarizeGa4Collect,
  type RunHistoryEntry,
  type RunStatus,
  type TestEventDetailSchema
} from '@utils';

/** How many runs the history strip shows, newest last. */
export const HISTORY_RUNS_SHOWN = 20;

/** One check of a run, as a card shows it. */
export type CheckCard = {
  passed: boolean;
  text: string;
  /** An ID shown after the text, unbroken. */
  code?: string;
};

/** One run in the history strip. */
export type HistoryDot = {
  runId: number;
  status: RunStatus;
  label: string;
  current: boolean;
};

/**
 * The verdict of a run: each check on its own card with why it passed or
 * failed, and the test's recent runs, each a link to that run.
 */
@Component({
  selector: 'app-run-verdict',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './run-verdict.component.html',
  styleUrls: ['./run-verdict.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RunVerdictComponent {
  run = input<TestEventDetailSchema | null>(null);
  runs = input<RunHistoryEntry[]>([]);
  eventName = input('');

  readonly status = computed<RunStatus>(() => {
    const run = this.run();
    return run ? getCheckStatus(run.passed, run.requestPassed) : 'notRun';
  });

  readonly dataLayerCheck = computed<CheckCard | null>(() => {
    const run = this.run();
    if (!run) {
      return null;
    }
    return run.passed
      ? {
          passed: true,
          text: `The site pushed ${this.eventName()} with every key the spec requires.`
        }
      : {
          passed: false,
          text: run.message || 'The dataLayer push did not match the spec.'
        };
  });

  readonly requestCheck = computed<CheckCard | null>(() => {
    const run = this.run();
    if (!run) {
      return null;
    }
    if (run.requestPassed) {
      const measurementId = run.rawRequest
        ? summarizeGa4Collect(run.rawRequest)?.measurementId
        : null;
      return measurementId
        ? {
            passed: true,
            text: `GA4 received ${this.eventName()} at`,
            code: measurementId
          }
        : { passed: true, text: `GA4 received ${this.eventName()}.` };
    }
    return {
      passed: false,
      text:
        run.requestMessage ||
        `No GA4 request for ${this.eventName()} was captured.`
    };
  });

  /** The latest HISTORY_RUNS_SHOWN runs, oldest first. */
  readonly history = computed<HistoryDot[]>(() => {
    const currentId = this.run()?.id;
    return this.runs()
      .slice(0, HISTORY_RUNS_SHOWN)
      .reverse()
      .map((run) => {
        const status = getCheckStatus(run.passed, run.requestPassed);
        return {
          runId: run.runId,
          status,
          label: `Run #${run.runId}: ${STATUS_LABELS[status]}`,
          current: run.runId === currentId
        };
      });
  });

  readonly passedCount = computed(
    () => this.history().filter((run) => run.status === 'passed').length
  );
}

const STATUS_LABELS: Record<RunStatus, string> = {
  notRun: 'Not run',
  passed: 'Passed',
  partial: 'Partial',
  failed: 'Failed'
};
