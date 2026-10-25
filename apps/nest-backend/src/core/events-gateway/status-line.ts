import type { RunStatusMessage } from '@utils';

/**
 * The environment variable the desktop app (Tauri) sets on its backend
 * sidecar to receive run status messages on stdout.
 */
export const STATUS_STDOUT_ENV = 'TAGCHECK_STATUS_STDOUT';

/** The start of every status line the desktop app reads from stdout. */
export const STATUS_LINE_PREFIX = 'TAGCHECK_STATUS ';

/** Writes one status line. */
export type StatusLineWriter = (line: string) => void;

/** The injection token of the StatusLineWriter RunStatusService uses. */
export const STATUS_LINE_WRITER = Symbol('STATUS_LINE_WRITER');

/** One status line: the prefix, the message as compact JSON and a newline. */
export function formatStatusLine(message: RunStatusMessage): string {
  // JSON.stringify escapes line breaks inside strings, so the message stays
  // on one line.
  return `${STATUS_LINE_PREFIX}${JSON.stringify(message)}\n`;
}

/**
 * The writer of status lines when the backend runs as the desktop sidecar
 * (`TAGCHECK_STATUS_STDOUT=1`), otherwise null: a backend started any other
 * way writes none. Lines go straight to `stdout.write`, not through the Nest
 * logger, which would add a timestamp and colours; one call per line keeps a
 * line whole between log lines.
 */
export function statusLineWriterFromEnv(
  env: Record<string, string | undefined>,
  stdout: { write(chunk: string): unknown }
): StatusLineWriter | null {
  if (env[STATUS_STDOUT_ENV] !== '1') {
    return null;
  }
  return (line) => {
    try {
      stdout.write(line);
    } catch {
      // The desktop app has gone; the run goes on without it.
    }
  };
}
