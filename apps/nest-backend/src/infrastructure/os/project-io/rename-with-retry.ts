import { renameSync } from 'fs';

const RETRYABLE_CODES = new Set(['EPERM', 'EACCES', 'EBUSY']);
const RETRY_BUDGET_MS = 10_000;
const MAX_DELAY_MS = 1_000;

/**
 * Renames a folder, allowing transient file locks up to ten seconds to clear.
 * Retries start after 100 ms and double up to one second between attempts.
 * @throws The last rename error when retries expire, or any other error at once.
 */
export async function renameWithRetry(
  source: string,
  destination: string
): Promise<void> {
  const deadline = Date.now() + RETRY_BUDGET_MS;
  let delayMs = 100;
  while (true) {
    try {
      renameSync(source, destination);
      return;
    } catch (error) {
      const remainingMs = deadline - Date.now();
      if (
        typeof error !== 'object' ||
        error === null ||
        !('code' in error) ||
        typeof error.code !== 'string' ||
        !RETRYABLE_CODES.has(error.code) ||
        remainingMs <= 0
      ) {
        throw error;
      }
      await new Promise<void>((resolve) =>
        setTimeout(resolve, Math.min(delayMs, remainingMs))
      );
      delayMs = Math.min(delayMs * 2, MAX_DELAY_MS);
    }
  }
}
