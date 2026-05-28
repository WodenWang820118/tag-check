import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';
import {
  getHttpDiagnosticMetadata,
  rethrowHttpError,
  setHttpDiagnosticMetadata
} from './http-error.utils';

describe('http-error utils diagnostics', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rethrows friendly errors with safe ES2022 cause metadata', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const originalError = new HttpErrorResponse({
      error: {
        reportContents: 'do-not-serialize',
        auth: 'secret',
        gtmJson: { containerVersion: {} }
      },
      headers: undefined,
      status: 0,
      statusText: 'Unknown Error',
      url: 'http://localhost:7001/reports/project-a?token=secret'
    });
    setHttpDiagnosticMetadata(originalError, {
      operation: 'get reports',
      method: 'GET',
      status: 0,
      url: '/reports/project-a',
      path: '/reports/project-a',
      requestId: '11111111-1111-4111-8111-111111111111'
    });

    await expect(
      firstValueFrom(
        throwError(() => originalError).pipe(
          rethrowHttpError('Failed to get reports')
        )
      )
    ).rejects.toMatchObject({
      message: 'Failed to get reports',
      cause: {
        operation: 'get reports',
        method: 'GET',
        status: 0,
        url: '/reports/project-a',
        path: '/reports/project-a',
        requestId: '11111111-1111-4111-8111-111111111111'
      }
    });
  });

  it('sanitizes HttpErrorResponse URLs without copying payloads or headers', () => {
    const originalError = new HttpErrorResponse({
      error: { rawBackendPayload: 'secret' },
      status: 500,
      statusText: 'Server Error',
      url: 'http://user:pass@example.test/reports/p?cookie=session'
    });

    expect(getHttpDiagnosticMetadata(originalError)).toEqual({
      status: 500,
      url: '/reports/p',
      path: '/reports/p'
    });
  });
});
