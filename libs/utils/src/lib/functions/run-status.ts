/** A test's status: not run yet, or how its latest run's two checks went. */
export type RunStatus = 'notRun' | 'passed' | 'partial' | 'failed';

/**
 * The status of a run from its two checks, the data layer check and the
 * request check: passed when both passed, partial when only one did. A run
 * that did not make the request check (Request Check off) is judged by its
 * data layer check alone; `requestChecked` missing means it did.
 */
export function getCheckStatus(
  passed: boolean | undefined,
  requestPassed: boolean | undefined,
  requestChecked: boolean | undefined = true
): Exclude<RunStatus, 'notRun'> {
  if (requestChecked === false) {
    return passed === true ? 'passed' : 'failed';
  }
  if (passed === true && requestPassed === true) {
    return 'passed';
  }
  return passed === true || requestPassed === true ? 'partial' : 'failed';
}
