import {
  HttpClient,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { apiRequestIdInterceptor } from './api-request-id.interceptor';
import { getHttpDiagnosticMetadata } from './http-error.utils';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('apiRequestIdInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiRequestIdInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('adds an x-request-id header to API requests', () => {
    http.get(`${environment.reportApiUrl}/project-a`).subscribe();

    const req = httpMock.expectOne(`${environment.reportApiUrl}/project-a`);
    const requestId = req.request.headers.get('x-request-id');

    expect(requestId).toMatch(UUID_V4_PATTERN);
    req.flush([]);
  });

  it('does not add x-request-id to non-API requests', () => {
    http.get('/assets/help.json').subscribe();

    const req = httpMock.expectOne('/assets/help.json');

    expect(req.request.headers.has('x-request-id')).toBe(false);
    req.flush({});
  });

  it('preserves sanitized diagnostics on status 0 network errors', async () => {
    const errorPromise = new Promise<unknown>((resolve) => {
      http
        .get(`${environment.reportApiUrl}/project-a?token=secret#frag`)
        .subscribe({ error: resolve });
    });

    const req = httpMock.expectOne(
      `${environment.reportApiUrl}/project-a?token=secret#frag`
    );
    const requestId = req.request.headers.get('x-request-id');

    req.error(new ProgressEvent('error'), {
      status: 0,
      statusText: 'Unknown Error'
    });

    const error = await errorPromise;

    expect(getHttpDiagnosticMetadata(error)).toEqual({
      method: 'GET',
      status: 0,
      url: '/reports/project-a',
      path: '/reports/project-a',
      requestId
    });
  });
});
