import type { GtmImportConflict } from '@utils';

export type ImportedEventMatch<T> =
  | { kind: 'same'; event: T }
  | { kind: 'conflict'; event: T }
  | { kind: 'new' };

/**
 * Prefer an existing same-event test so an earlier same-name conflict does not
 * take its place.
 */
export function matchImportedEvent<
  T extends { readonly testName: string; readonly eventName: string }
>(
  existing: readonly T[],
  input: { readonly testName: string; readonly eventName: string }
): ImportedEventMatch<T> {
  const same = existing.find(
    (event) =>
      event.testName === input.testName && event.eventName === input.eventName
  );
  if (same) {
    return { kind: 'same', event: same };
  }
  const conflict = existing.find((event) => event.testName === input.testName);
  if (conflict) {
    return { kind: 'conflict', event: conflict };
  }
  return { kind: 'new' };
}

/**
 * Ask once per conflicting tag name while preserving the import's first-seen
 * order.
 */
export function findGtmImportConflicts<
  TExisting extends { readonly testName: string; readonly eventName: string },
  TInput extends { readonly testName: string; readonly eventName: string }
>(
  existing: readonly TExisting[],
  inputs: readonly TInput[],
  isSpecEdited: (existing: TExisting) => boolean
): GtmImportConflict[] {
  const conflicts: GtmImportConflict[] = [];
  const seen = new Set<string>();
  for (const input of inputs) {
    const match = matchImportedEvent(existing, input);
    if (match.kind !== 'conflict' || seen.has(input.testName)) {
      continue;
    }
    seen.add(input.testName);
    conflicts.push({
      tagName: input.testName,
      existingEventName: match.event.eventName,
      newEventName: input.eventName,
      specEdited: isSpecEdited(match.event)
    });
  }
  return conflicts;
}
