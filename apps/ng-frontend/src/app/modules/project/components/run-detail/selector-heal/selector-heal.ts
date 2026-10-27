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
 * A recorded selector group as one line: a chain into shadow roots joins
 * its parts with Puppeteer's ` >>>> ` combinator, as the replay does.
 */
export function selectorGroupText(group: string | string[]): string {
  return Array.isArray(group) ? group.join(' >>>> ') : group;
}

/**
 * The selectors to save: `all`, in the same order, without the ones the
 * user unticked. The diff still lists those, so a dialog passes this list,
 * not the full replacement, to `withStepSelectors`.
 */
export function chosenSelectors(
  all: readonly string[],
  excluded: readonly string[]
): string[] {
  return all.filter((selector) => !excluded.includes(selector));
}

/**
 * The recording with unticked selectors taken off the step. Keeping the
 * old selectors can put one back when it was already on the step; a
 * selector the user left unticked is not saved. The recording itself is
 * not changed.
 */
export function withoutExcludedSelectors(
  recording: Recording,
  stepIndex: number,
  excluded: readonly string[]
): Recording {
  const step = recording.steps[stepIndex];
  if (!step || excluded.length === 0) return recording;
  const selectors = (step.selectors ?? []).filter(
    (group) => !excluded.includes(selectorGroupText(group))
  );
  if (selectors.length === (step.selectors ?? []).length) return recording;
  const steps = [...recording.steps];
  steps[stepIndex] = { ...step, selectors };
  return { ...recording, steps };
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
