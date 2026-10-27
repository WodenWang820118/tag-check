import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import {
  compareWithSpec,
  type SpecComparisonRow,
  type SpecRequirement
} from '@utils';

/** A value as the table shows it: JSON, with strings in quotes. */
export function showValue(value: unknown): string {
  if (value === undefined) {
    return '—';
  }
  return typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
}

const REQUIREMENTS: Record<SpecRequirement, string> = {
  equal: 'equal to',
  present: 'any value',
  pattern: 'matching'
};

/** One comparison row, ready to show. */
export type ComparisonLine = {
  path: string;
  expected: string;
  requirement: string;
  actual: string;
  passed: boolean;
  result: string;
};

function toLine(row: SpecComparisonRow): ComparisonLine {
  return {
    path: row.path,
    expected:
      row.requirement === 'present'
        ? String(row.expected)
        : showValue(row.expected),
    requirement: REQUIREMENTS[row.requirement],
    actual: showValue(row.actual),
    passed: row.passed,
    result: row.passed
      ? row.requirement === 'present'
        ? 'Present'
        : 'Match'
      : (row.reason ?? 'Failed')
  };
}

/**
 * What the spec asks for next to what the site pushed, key by key, by the
 * dataLayer check's rules; and the pushed keys the spec does not mention.
 */
@Component({
  selector: 'app-spec-comparison',
  standalone: true,
  templateUrl: './spec-comparison.component.html',
  styleUrls: ['./spec-comparison.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpecComparisonComponent {
  /** The spec's dataLayer push. */
  spec = input<Record<string, unknown> | undefined>(undefined);
  /** What the run captured: the pushed event that matched, if any. */
  dataLayer = input<readonly unknown[] | undefined>(undefined);

  readonly comparison = computed(() => {
    const spec = this.spec();
    if (!spec) {
      return null;
    }
    const pushed = this.dataLayer()?.[0];
    const { rows, extras } = compareWithSpec(
      spec,
      pushed && typeof pushed === 'object'
        ? (pushed as Record<string, unknown>)
        : undefined
    );
    return {
      lines: rows.map(toLine),
      extras: extras.map((extra) => ({
        path: extra.path,
        value: showValue(extra.actual)
      })),
      captured: pushed !== undefined
    };
  });
}
