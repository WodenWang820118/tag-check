import type { Recording } from '@utils';

/** One line of the change to a step's selectors. */
export type SelectorChange = {
  change: 'add' | 'remove' | 'keep';
  selector: string;
};

/** A selector group's first selector, as a step waits for it. */
function firstOf(group: string | string[]): string {
  return Array.isArray(group) ? (group[0] ?? '') : group;
}

/**
 * How a step's selectors change: the new ones first, then the old ones,
 * kept after them or removed. An old selector the new ones repeat is not
 * listed twice.
 */
export function selectorChanges(
  old: readonly string[],
  replacement: readonly string[],
  keepOld: boolean
): SelectorChange[] {
  return [
    ...replacement.map((selector) => ({ change: 'add' as const, selector })),
    ...old
      .filter((selector) => !replacement.includes(selector))
      .map((selector) => ({
        change: keepOld ? ('keep' as const) : ('remove' as const),
        selector
      }))
  ];
}

/**
 * The recording with step `stepIndex` waiting for `replacement`, then its
 * old selector groups (as recorded, piercing chains included) when
 * `keepOld` is set. The recording itself is not changed.
 *
 * @throws Error when the recording has no such step.
 */
export function withStepSelectors(
  recording: Recording,
  stepIndex: number,
  replacement: readonly string[],
  keepOld: boolean
): Recording {
  const step = recording.steps[stepIndex];
  if (!step) {
    throw new Error(`The recording has no step ${stepIndex + 1}`);
  }
  const kept = keepOld
    ? (step.selectors ?? []).filter(
        (group) => !replacement.includes(firstOf(group))
      )
    : [];
  const steps = [...recording.steps];
  steps[stepIndex] = {
    ...step,
    selectors: [...replacement.map((selector) => [selector]), ...kept]
  };
  return { ...recording, steps };
}
