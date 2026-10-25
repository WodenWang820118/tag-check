import { Jsonified, RunSummary } from '@utils';

/** Reads the text and event filter from the table's one filter string. */
function parseFilter(filter: string): { text: string; eventName: string } {
  try {
    const value: unknown = JSON.parse(filter || '{}');
    if (typeof value === 'object' && value !== null) {
      return {
        text:
          'text' in value && typeof value.text === 'string' ? value.text : '',
        eventName:
          'eventName' in value && typeof value.eventName === 'string'
            ? value.eventName
            : ''
      };
    }
  } catch {
    // Not JSON: the whole string is a text filter.
  }
  return { text: filter, eventName: '' };
}

/** The filter string for a text filter and an event (empty for every event). */
export function toRunFilter(text: string, eventName: string): string {
  return JSON.stringify({ text, eventName });
}

/**
 * The Reports table's filter predicate. MatTableDataSource takes one filter
 * string, so the toolbar's text and the event that History opens the page
 * with (`?event=`) travel together as JSON (see toRunFilter). A run matches
 * when its event is that event and its test or event name contains the text.
 */
export function runFilterPredicate(
  row: Jsonified<RunSummary>,
  filter: string
): boolean {
  const { text, eventName } = parseFilter(filter);
  const needle = text.trim().toLowerCase();
  const haystack = `${row.testName ?? ''} ${row.eventName ?? ''}`.toLowerCase();
  return (
    (!eventName || row.eventName === eventName) &&
    (!needle || haystack.includes(needle))
  );
}
