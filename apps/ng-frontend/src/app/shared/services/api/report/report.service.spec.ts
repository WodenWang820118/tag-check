import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { API_OPERATION_CONTEXT } from '../api-request-id.interceptor';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: ReportService;

  beforeEach(() => {
    httpClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    service = new ReportService(httpClient as unknown as HttpClient);
  });

  afterEach(() => vi.restoreAllMocks());

  it('getProjectReports sets the reports.list operation context', async () => {
    httpClient.get.mockReturnValueOnce(of([]));

    await firstValueFrom(service.getProjectReports('s'));

    expect(httpClient.get).toHaveBeenCalledWith(
      `${environment.reportApiUrl}/s`,
      expect.objectContaining({ context: expect.anything() })
    );
    const options = httpClient.get.mock.calls[0][1] as {
      context: { get: (token: typeof API_OPERATION_CONTEXT) => string };
    };
    expect(options.context.get(API_OPERATION_CONTEXT)).toBe('reports.list');
  });

  it('getProjectReports rethrows wrapped errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(
      firstValueFrom(service.getProjectReports('s'))
    ).rejects.toThrow('Failed to get reports');
  });

  it('updateTestEvents PUTs the array body', async () => {
    httpClient.put.mockReturnValueOnce(of([] as never));
    await firstValueFrom(
      service.updateTestEvents('s', [{ eventId: 'a' } as never])
    );
    expect(httpClient.put).toHaveBeenCalledWith(
      `${environment.reportApiUrl}/s`,
      [{ eventId: 'a' }]
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.put.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(
      firstValueFrom(service.updateTestEvents('s', []))
    ).rejects.toThrow('Failed to update test event');
  });

  it('addReport POSTs reportDetails/recording/spec to /:slug/:eventId', async () => {
    httpClient.post.mockReturnValueOnce(of({} as never));
    await firstValueFrom(
      service.addReport(
        's',
        'evt',
        { eventId: 'a' } as never,
        { name: 'r' } as never,
        { event: 'a' } as never
      )
    );
    expect(httpClient.post).toHaveBeenCalledWith(
      `${environment.reportApiUrl}/s/evt`,
      {
        reportDetails: { eventId: 'a' },
        recording: { name: 'r' },
        spec: { event: 'a' }
      }
    );
  });

  it('addFullReport POSTs reportDetails/recording/spec/dataLayerSpec', async () => {
    httpClient.post.mockReturnValueOnce(of({} as never));
    await firstValueFrom(
      service.addFullReport(
        's',
        'evt',
        { eventId: 'a' } as never,
        { name: 'r' } as never,
        { spec: 'foo' } as never,
        { event: 'a' } as never
      )
    );
    expect(httpClient.post.mock.calls[0][1]).toEqual({
      reportDetails: { eventId: 'a' },
      recording: { name: 'r' },
      spec: { spec: 'foo' },
      dataLayerSpec: { event: 'a' }
    });
  });

  it('deleteBatchReports throws when projectSlug or eventIds are missing', () => {
    expect(() => service.deleteBatchReports('', ['a'])).toThrow(
      'Invalid arguments'
    );
    expect(() =>
      service.deleteBatchReports('s', null as unknown as string[])
    ).toThrow('Invalid arguments');
  });

  it('deleteBatchReports DELETEs with the ids in the request body', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    httpClient.delete.mockReturnValueOnce(of({ ok: true } as never));
    await firstValueFrom(service.deleteBatchReports('s', ['a', 'b']));
    expect(httpClient.delete).toHaveBeenCalledWith(
      `${environment.reportApiUrl}/s`,
      { body: ['a', 'b'] }
    );
  });

  it('deleteBatchReports rethrows a failure so the caller can report it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.delete.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(
      firstValueFrom(service.deleteBatchReports('s', ['a']))
    ).rejects.toThrow('Failed to delete tests');
  });

  it('getReportDetails rethrows a friendly error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(
      firstValueFrom(service.getReportDetails('s', 'a'))
    ).rejects.toThrow('Failed to get report details');
    const options = httpClient.get.mock.calls[0][1] as {
      context: { get: (token: typeof API_OPERATION_CONTEXT) => string };
    };
    expect(options.context.get(API_OPERATION_CONTEXT)).toBe('reports.detail');
  });
});
