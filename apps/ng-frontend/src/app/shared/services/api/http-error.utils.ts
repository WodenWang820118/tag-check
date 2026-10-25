import { HttpErrorResponse } from '@angular/common/http';
import { Observable, OperatorFunction, catchError, of, throwError } from 'rxjs';

export interface HttpDiagnosticMetadata {
  operation?: string;
  method?: string;
  status?: number;
  url?: string;
  path?: string;
  requestId?: string;
}

const httpDiagnosticMetadataByError = new WeakMap<
  object,
  HttpDiagnosticMetadata
>();

export function setHttpDiagnosticMetadata(
  error: object,
  metadata: HttpDiagnosticMetadata
): void {
  httpDiagnosticMetadataByError.set(error, removeUndefined(metadata));
}

export function getHttpDiagnosticMetadata(
  error: unknown,
  operation?: string
): HttpDiagnosticMetadata | undefined {
  if (!(error instanceof HttpErrorResponse)) {
    return undefined;
  }

  const interceptorMetadata = httpDiagnosticMetadataByError.get(error);
  const baseMetadata: HttpDiagnosticMetadata = interceptorMetadata ?? {
    status: error.status,
    ...sanitizeUrlPath(error.url ?? undefined)
  };

  return removeUndefined({
    ...baseMetadata,
    operation: operation ?? baseMetadata.operation
  });
}

function removeUndefined(
  metadata: HttpDiagnosticMetadata
): HttpDiagnosticMetadata {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  ) as HttpDiagnosticMetadata;
}

function sanitizeUrlPath(
  url: string | undefined
): Pick<HttpDiagnosticMetadata, 'url' | 'path'> {
  if (!url) {
    return {};
  }

  try {
    const parsed = new URL(url, globalThis.location?.origin ?? 'http://local');
    return { url: parsed.pathname, path: parsed.pathname };
  } catch {
    const path = url.split(/[?#]/, 1)[0];
    return path ? { url: path, path } : {};
  }
}

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
export function rethrowHttpError<T>(
  message: string,
  options: { operation?: string } = {}
): OperatorFunction<T, T> {
  return (source: Observable<T>) =>
    source.pipe(
      catchError((error: unknown) => {
        console.error(error);
        return throwError(
          () =>
            new Error(message, {
              cause: getHttpDiagnosticMetadata(error, options.operation)
            })
        );
      })
    );
}

/** Reads a non-empty string `message` field of a JSON object. */
function readMessage(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('message' in value)) {
    return undefined;
  }
  const { message } = value;
  return typeof message === 'string' && message !== '' ? message : undefined;
}

/**
 * The reason the API gave for a failed request, for the user, or `fallback`
 * when it gave none. The backend's error filter wraps an HttpException, so a
 * 400 body is `{ statusCode, message: { message: '<reason>', ... }, ... }`;
 * other bodies carry the reason as a string `message`. An Error whose
 * `cause` is the HttpErrorResponse, as the run services throw, is read the
 * same way.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const response =
    error instanceof Error && error.cause instanceof HttpErrorResponse
      ? error.cause
      : error;
  if (!(response instanceof HttpErrorResponse)) {
    return fallback;
  }
  const body: unknown = response.error;
  const wrapped =
    typeof body === 'object' && body !== null && 'message' in body
      ? readMessage(body.message)
      : undefined;
  return wrapped ?? readMessage(body) ?? fallback;
}
