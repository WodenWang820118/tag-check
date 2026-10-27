/**
 * The lowest `tagName (n)` that is not already a test name. `n` starts at 1.
 * A re-import uses this when the existing test is kept and a new one is added,
 * so test names stay unique in the project.
 */
export function keepBothTestName(
  tagName: string,
  taken: ReadonlySet<string>
): string {
  let suffix = 1;
  let name = `${tagName} (${suffix})`;
  while (taken.has(name)) {
    suffix += 1;
    name = `${tagName} (${suffix})`;
  }
  return name;
}
