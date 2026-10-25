import { IReportDetails, RunStatus } from '@utils';
import { getRunStatus } from '../report-detail.contracts';

/** The tests table's status filter: every test, or the tests with one status. */
export type StatusFilter = 'all' | RunStatus;

/** Reads the text and status filter from the table's one filter string. */
function parseFilter(filter: string): { text: string; status: string } {
  try {
    const value: unknown = JSON.parse(filter || '{}');
    if (typeof value === 'object' && value !== null) {
      return {
        text:
          'text' in value && typeof value.text === 'string' ? value.text : '',
        status:
          'status' in value && typeof value.status === 'string'
            ? value.status
            : 'all'
      };
    }
  } catch {
    // Not JSON: the whole string is a text filter.
  }
  return { text: filter, status: 'all' };
}

/** The filter string for a text and a status filter. */
export function toReportFilter(text: string, status: StatusFilter): string {
  return JSON.stringify({ text, status });
}

/**
 * The tests table's filter predicate. MatTableDataSource takes one filter
 * string, so the text and the status filter travel together as JSON (see
 * toReportFilter). A row matches when its test or event name contains the
 * text and its status, as the row's chip shows it, is the one filtered for.
 */
export function reportFilterPredicate(
  row: IReportDetails,
  filter: string
): boolean {
  const { text, status } = parseFilter(filter);
  const haystack = `${row.testName ?? ''} ${row.eventName ?? ''}`.toLowerCase();
  const textMatch = !text || haystack.includes(text.toLowerCase());
  return textMatch && (status === 'all' || status === getRunStatus(row));
}
