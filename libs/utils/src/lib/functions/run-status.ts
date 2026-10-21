/** A test's status: not run yet, or how its latest run's two checks went. */
export type RunStatus = 'notRun' | 'passed' | 'partial' | 'failed';

/**
 * The status of a run from its two checks, the data layer check and the
 * request check: passed when both passed, partial when only one did.
 */
export function getCheckStatus(
  passed: boolean | undefined,
  requestPassed: boolean | undefined
): Exclude<RunStatus, 'notRun'> {
  if (passed === true && requestPassed === true) {
    return 'passed';
  }
  return passed === true || requestPassed === true ? 'partial' : 'failed';
}
