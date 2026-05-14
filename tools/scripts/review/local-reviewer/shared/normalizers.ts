import type { LocalReviewSeverity } from './types.ts';

export function normalizeHybridPath(candidate: string): string {
  return candidate.trim().replaceAll('\\', '/').replace(/^\.\//, '');
}

export function normalizeLocalReviewSeverity(
  value: unknown
): LocalReviewSeverity {
  if (
    value === 'critical' ||
    value === 'high' ||
    value === 'medium' ||
    value === 'low' ||
    value === 'info'
  ) {
    return value;
  }

  return 'info';
}

export function normalizeOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeOptionalLineNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
