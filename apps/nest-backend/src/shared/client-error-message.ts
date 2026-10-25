const MAX_LENGTH = 300;

// A drive letter not preceded by a letter or digit, so a URL's "https:" is kept.
const WINDOWS_PATH = /(^|[^A-Za-z0-9])[A-Za-z]:[\\/][^\s'"`]*/g;
const UNC_PATH = /\\\\[^\s'"`]+/g;
// An absolute POSIX path of two or more segments at the start of the message
// or after a space, quote, bracket or "=". A URL's path follows its host, not
// one of these, so it is kept.
const POSIX_PATH = /(^|[\s'"`(=])\/(?:[^\s'"`/]+\/)+[^\s'"`]*/g;

/**
 * Turns a failed run's error into a reason the API can send to the client:
 * the first line of its message, with file paths replaced by "<path>" and at
 * most 300 characters. Stack traces and the lines after the first (Chromium's
 * launch log, for instance) are left out. Returns an empty string when the
 * error carries no message.
 */
export function toClientErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const firstLine = message.split(/\r?\n/, 1)[0] ?? '';
  const reason = firstLine
    .replace(WINDOWS_PATH, '$1<path>')
    .replace(UNC_PATH, '<path>')
    .replace(POSIX_PATH, '$1<path>')
    .trim();
  return reason.length > MAX_LENGTH
    ? `${reason.slice(0, MAX_LENGTH - 1)}…`
    : reason;
}
