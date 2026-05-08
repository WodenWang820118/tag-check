import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
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

  it('updateReport PUTs the single report body', async () => {
    httpClient.put.mockReturnValueOnce(of({} as never));
    await firstValueFrom(service.updateReport('s', { eventId: 'a' } as never));
    expect(httpClient.put).toHaveBeenCalledWith(
      `${environment.reportApiUrl}/s`,
      { eventId: 'a' }
    );
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

  it('downloadFile creates a temporary anchor, clicks it and revokes the URL', () => {
    const blob = new Blob(['xlsx']);
    httpClient.get.mockReturnValueOnce(of(blob));
    const click = vi.fn();
    const anchor = {
      click,
      href: '',
      download: ''
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const createSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:fake');
    const revokeSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);
    service.downloadFile('s', 'evt');
    expect(httpClient.get).toHaveBeenCalledWith(
      `${environment.reportApiUrl}/xlsx/s/evt`,
      { responseType: 'blob' }
    );
    expect(anchor.download).toBe('s_evt.xlsx');
    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:fake');
  });

  it('downloadFile swallows errors and skips anchor creation', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    const createElement = vi.spyOn(document, 'createElement');
    service.downloadFile('s', 'evt');
    expect(createElement).not.toHaveBeenCalled();
  });

  it('deleteReports issues a DELETE per report and joins the responses', async () => {
    httpClient.delete
      .mockReturnValueOnce(of({ id: 1 } as never))
      .mockReturnValueOnce(of({ id: 2 } as never));
    const result = await firstValueFrom(
      service.deleteReports('s', [
        { eventId: 'a' } as never,
        { eventId: 'b' } as never
      ])
    );
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(httpClient.delete).toHaveBeenNthCalledWith(
      1,
      `${environment.reportApiUrl}/s/a`
    );
    expect(httpClient.delete).toHaveBeenNthCalledWith(
      2,
      `${environment.reportApiUrl}/s/b`
    );
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

  it('getReportDetails rethrows the underlying error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(
      firstValueFrom(service.getReportDetails('s', 'a'))
    ).rejects.toThrow('x');
  });
});
