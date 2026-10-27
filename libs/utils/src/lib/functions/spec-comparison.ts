/**
 * Compares a dataLayer push with its spec key by key, for people: one row per
 * key the spec asks for, and the pushed keys the spec does not mention. It
 * applies the backend's rules (DataLayerValidationUtilsService), so a row
 * fails exactly where the dataLayer check does:
 *
 * - a number, boolean or plain string must equal the pushed value;
 * - `/pattern/` must match the pushed string;
 * - `$name` or a Tag Manager variable reference only needs the key;
 * - an object is matched key by key;
 * - every entry of an array must match at least one pushed entry, in any
 *   order.
 */

/** A Tag Manager variable such as `{{DLV - ecommerce.value}}`. */
const GTM_VARIABLE_REFERENCE = /\{\{[^}]+\}\}/;

/** What a spec value asks of the pushed value. */
export type SpecRequirement = 'equal' | 'present' | 'pattern';

/** One key the spec asks for. */
export type SpecComparisonRow = {
  /** Such as `ecommerce.items[0].price`; an array entry is the pushed one it matched. */
  path: string;
  /** The spec's value. */
  expected: unknown;
  /** The pushed value; undefined when the key is missing. */
  actual: unknown;
  requirement: SpecRequirement;
  passed: boolean;
  /** Why it failed: missing, different, not a string, ... */
  reason?: string;
};

export type SpecComparison = {
  rows: SpecComparisonRow[];
  /** Pushed keys (or array entries) the spec does not mention. */
  extras: { path: string; actual: unknown }[];
};

type Indexable = Record<string, unknown>;

function isPlainObject(value: unknown): value is Indexable {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requirementOf(expected: unknown): SpecRequirement {
  if (typeof expected !== 'string') {
    return 'equal';
  }
  if (expected.startsWith('$') || GTM_VARIABLE_REFERENCE.test(expected)) {
    return 'present';
  }
  return expected.length > 1 &&
    expected.startsWith('/') &&
    expected.endsWith('/')
    ? 'pattern'
    : 'equal';
}

function compareValue(
  expected: unknown,
  actual: unknown,
  path: string,
  rows: SpecComparisonRow[]
): void {
  if (Array.isArray(expected)) {
    compareArray(expected, actual, path, rows);
    return;
  }
  if (isPlainObject(expected)) {
    if (!isPlainObject(actual)) {
      rows.push({
        path,
        expected,
        actual,
        requirement: 'equal',
        passed: false,
        reason: 'not an object'
      });
      return;
    }
    compareObject(expected, actual, path, rows);
    return;
  }
  const requirement = requirementOf(expected);
  const row: SpecComparisonRow = {
    path,
    expected,
    actual,
    requirement,
    passed: true
  };
  if (requirement === 'pattern') {
    if (typeof actual !== 'string') {
      Object.assign(row, { passed: false, reason: 'not a string' });
    } else {
      try {
        if (!new RegExp((expected as string).slice(1, -1)).test(actual)) {
          Object.assign(row, {
            passed: false,
            reason: 'does not match the pattern'
          });
        }
      } catch {
        Object.assign(row, {
          passed: false,
          reason: 'the pattern is not valid'
        });
      }
    }
  } else if (
    requirement === 'equal' &&
    (typeof expected === 'string' ||
      typeof expected === 'number' ||
      typeof expected === 'boolean') &&
    expected !== actual
  ) {
    Object.assign(row, { passed: false, reason: 'different' });
  }
  rows.push(row);
}

function compareObject(
  expected: Indexable,
  actual: Indexable,
  path: string,
  rows: SpecComparisonRow[]
): void {
  for (const key of Object.keys(expected)) {
    const keyPath = path ? `${path}.${key}` : key;
    if (!(key in actual)) {
      rows.push({
        path: keyPath,
        expected: expected[key],
        actual: undefined,
        requirement: requirementOf(expected[key]),
        passed: false,
        reason: 'missing'
      });
    } else {
      compareValue(expected[key], actual[key], keyPath, rows);
    }
  }
}

function compareArray(
  expected: unknown[],
  actual: unknown,
  path: string,
  rows: SpecComparisonRow[]
): void {
  if (!Array.isArray(actual)) {
    rows.push({
      path,
      expected,
      actual,
      requirement: 'equal',
      passed: false,
      reason: 'not an array'
    });
    return;
  }
  expected.forEach((entry, index) => {
    // The pushed entry the spec entry matches; without one, the backend
    // reports the entry at the same position (or the first).
    const attempts = actual.map((candidate, at) => {
      const entryRows: SpecComparisonRow[] = [];
      compareValue(entry, candidate, `${path}[${at}]`, entryRows);
      return entryRows;
    });
    const matched = attempts.find((entryRows) =>
      entryRows.every((row) => row.passed)
    );
    const shown = matched ?? attempts[index] ?? attempts[0];
    if (shown) {
      rows.push(...shown);
    } else {
      rows.push({
        path: `${path}[${index}]`,
        expected: entry,
        actual: undefined,
        requirement: requirementOf(entry),
        passed: false,
        reason: 'missing'
      });
    }
  });
}

/** Pushed leaves (and unmatched array entries) under `path` no row covers. */
function collectExtras(
  actual: unknown,
  path: string,
  covered: Set<string>,
  extras: SpecComparison['extras']
): void {
  if (covered.has(path)) {
    return;
  }
  const prefix = path ? `${path}.` : '';
  const underCovered = [...covered].some(
    (row) => row.startsWith(prefix) || row.startsWith(`${path}[`)
  );
  if (path && !underCovered) {
    extras.push({ path, actual });
    return;
  }
  if (Array.isArray(actual)) {
    actual.forEach((entry, at) =>
      collectExtras(entry, `${path}[${at}]`, covered, extras)
    );
  } else if (isPlainObject(actual)) {
    for (const key of Object.keys(actual)) {
      collectExtras(actual[key], `${prefix}${key}`, covered, extras);
    }
  }
}

/**
 * Compares the pushed event with its spec. Without a pushed event, every key
 * the spec asks for is missing.
 */
export function compareWithSpec(
  spec: Indexable,
  actual: Indexable | null | undefined
): SpecComparison {
  const rows: SpecComparisonRow[] = [];
  compareObject(spec, actual ?? {}, '', rows);
  const extras: SpecComparison['extras'] = [];
  if (actual) {
    collectExtras(actual, '', new Set(rows.map((row) => row.path)), extras);
  }
  return { rows, extras };
}
