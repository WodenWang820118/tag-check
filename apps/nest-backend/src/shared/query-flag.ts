/**
 * Reads an on/off flag that arrives as a query-string value, such as
 * `captureRequest` or `headless`. Only "true" and "1" mean on; anything
 * else, including a missing value, means off.
 */
export function isQueryFlagOn(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}
