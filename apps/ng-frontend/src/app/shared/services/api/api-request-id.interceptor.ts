import {
  HttpContextToken,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { setHttpDiagnosticMetadata } from './http-error.utils';

const REQUEST_ID_HEADER = 'x-request-id';

const API_URL_PREFIXES = Object.entries(environment)
  .filter(([key, value]) => key.endsWith('ApiUrl') && typeof value === 'string')
  .map(([, value]) => value as string);

export const API_OPERATION_CONTEXT = new HttpContextToken<string | undefined>(
  () => undefined
);

export const apiRequestIdInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (!isApiRequest(request.url)) {
    return next(request);
  }

  const requestId = createRequestId();
  const requestWithId = request.clone({
    setHeaders: {
      [REQUEST_ID_HEADER]: requestId
    }
  });

  return next(requestWithId).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        setHttpDiagnosticMetadata(error, {
          operation: request.context.get(API_OPERATION_CONTEXT),
          method: request.method,
          status: error.status,
          ...sanitizeUrlPath(error.url ?? request.urlWithParams),
          requestId
        });
      }

      return throwError(() => error);
    })
  );
};

function isApiRequest(url: string): boolean {
  return API_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function createRequestId(): string {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID === 'function') {
    return randomUUID.call(globalThis.crypto);
  }

  // Diagnostic correlation only: this fallback is not cryptographically secure
  // and must not be reused for auth, secrets, or durable identifiers.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function sanitizeUrlPath(url: string): { url: string; path: string } {
  try {
    const parsed = new URL(url, globalThis.location?.origin ?? 'http://local');
    return { url: parsed.pathname, path: parsed.pathname };
  } catch {
    const path = url.split(/[?#]/, 1)[0] || '[unavailable]';
    return { url: path, path };
  }
}
