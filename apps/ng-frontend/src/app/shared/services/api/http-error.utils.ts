import { Observable, OperatorFunction, catchError, of, throwError } from 'rxjs';

/**
 * Creates an RxJS `catchError` operator that logs the error to the console
 * and falls back to an observable emitting the provided value.
 *
 * Use this when a missing or empty result is an acceptable degraded state
 * (e.g. returning `[]` for a list that could not be fetched, or `null` for
 * an optional resource). The returned observable completes after emitting
 * the fallback.
 *
 * Do NOT use this for operations whose failure must be surfaced to the caller
 * (e.g. write operations, required loads). Prefer {@link rethrowHttpError}.
 *
 * @param fallback - The value to emit when the source errors out.
 *
 * @example
 * // List endpoint — empty array is a safe default
 * return this.http.get<Item[]>(url).pipe(catchHttpError([]));
 *
 * @example
 * // Optional single resource — null is a safe default
 * return this.http.get<Config>(url).pipe(catchHttpError(null));
 */
export function catchHttpError<T, F>(fallback: F): OperatorFunction<T, T | F> {
  return catchError((error: unknown) => {
    console.error(error);
    return of(fallback) as Observable<T | F>;
  });
}

/**
 * Creates an RxJS `catchError` operator that logs the error to the console
 * and rethrows it as a normalized {@link Error} with the given human-readable
 * message.
 *
 * Use this when the failure must be surfaced to the consumer (e.g. triggering
 * a component error state or a global error handler). The original error is
 * logged before being replaced with a friendlier message so diagnostics are
 * preserved.
 *
 * @param message - Human-readable description forwarded to the new `Error`.
 *
 * @example
 * return this.http.get<Spec>(url).pipe(rethrowHttpError('Failed to load spec'));
 */
export function rethrowHttpError<T>(message: string): OperatorFunction<T, T> {
  return (source: Observable<T>) =>
    source.pipe(
      catchError((error: unknown) => {
        console.error(error);
        return throwError(() => new Error(message));
      })
    );
}
