/** A run as the pairing needs it: when it started and its linked screenshot. */
export type RunTiming = {
  id: number;
  createdAt: Date;
  testImage?: { id: number } | null;
};

/** A screenshot as the pairing needs it: when it was saved. */
export type ScreenshotTiming = { id: number; createdAt: Date };

/**
 * The screenshots the given runs saved. A run linked to its screenshot names
 * it. A run saved before runs were linked took its screenshot after it began
 * and before the test's next run began: the first unlinked screenshot in that
 * window is its own.
 *
 * @param runs - Every run of one test, oldest first.
 * @param screenshots - Every screenshot of that test, oldest first.
 * @param runIds - The runs whose screenshots to return.
 */
export function screenshotsOfRuns(
  runs: readonly RunTiming[],
  screenshots: readonly ScreenshotTiming[],
  runIds: ReadonlySet<number>
): number[] {
  const linked = new Set(
    runs.flatMap((run) => (run.testImage ? [run.testImage.id] : []))
  );
  const unlinked = screenshots.filter(
    (screenshot) => !linked.has(screenshot.id)
  );
  const paired = new Set<number>();
  const found: number[] = [];

  runs.forEach((run, index) => {
    const start = run.createdAt.getTime();
    const end = runs[index + 1]?.createdAt.getTime() ?? Infinity;
    const screenshotId =
      run.testImage?.id ??
      unlinked.find(
        (screenshot) =>
          !paired.has(screenshot.id) &&
          screenshot.createdAt.getTime() >= start &&
          screenshot.createdAt.getTime() < end
      )?.id;
    if (screenshotId === undefined) {
      return;
    }
    paired.add(screenshotId);
    if (runIds.has(run.id)) {
      found.push(screenshotId);
    }
  });
  return found;
}
