import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';
import {
  apiErrorMessage,
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

describe('apiErrorMessage', () => {
  it("reads the reason the backend's error filter wraps", () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        statusCode: 400,
        message: {
          message: 'time must be HH:MM, from 00:00 to 23:59',
          error: 'Bad Request',
          statusCode: 400
        },
        path: '/schedules/demo'
      }
    });

    expect(apiErrorMessage(error, 'Could not save')).toBe(
      'time must be HH:MM, from 00:00 to 23:59'
    );
  });

  it('reads a plain message, also from an Error caused by the response', () => {
    const response = new HttpErrorResponse({
      status: 500,
      error: { statusCode: 500, message: 'No recording found' }
    });

    expect(apiErrorMessage(response, 'Failed')).toBe('No recording found');
    expect(
      apiErrorMessage(new Error('Run failed', { cause: response }), 'Failed')
    ).toBe('No recording found');
  });

  it('falls back when the API gave no reason', () => {
    expect(
      apiErrorMessage(new HttpErrorResponse({ status: 0 }), 'Offline')
    ).toBe('Offline');
    expect(apiErrorMessage(new Error('boom'), 'Failed')).toBe('Failed');
  });
});
