import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { FileReportService } from './file-report.service';

describe('FileReportService', () => {
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: FileReportService;

  beforeEach(() => {
    httpClient = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
    service = new FileReportService(httpClient as unknown as HttpClient);
  });

  afterEach(() => vi.restoreAllMocks());

  it('getFileReports returns the response and falls back to null on error', async () => {
    httpClient.get.mockReturnValueOnce(of([{ id: 1 }] as never));
    expect(await firstValueFrom(service.getFileReports('slug'))).toEqual([
      { id: 1 }
    ]);
    expect(httpClient.get).toHaveBeenCalledWith(
      `${environment.fileReportApiUrl}/slug`
    );

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    expect(await firstValueFrom(service.getFileReports('slug'))).toBeNull();
  });

  it('deleteRuns sends the run ids as one list and rethrows on error', async () => {
    httpClient.delete.mockReturnValueOnce(of({ deletedRunIds: [7, 9] }));
    expect(await firstValueFrom(service.deleteRuns('slug', [7, 9]))).toEqual({
      deletedRunIds: [7, 9]
    });
    expect(httpClient.delete).toHaveBeenCalledWith(
      `${environment.fileReportApiUrl}/slug`,
      { params: { runIds: '7,9' } }
    );

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.delete.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(
      firstValueFrom(service.deleteRuns('slug', [7]))
    ).rejects.toThrow('Error deleting runs');
  });

  it('downloadFileReports returns null when the response body is empty', async () => {
    const response = new HttpResponse<Blob>({
      body: null,
      headers: new HttpHeaders()
    });
    httpClient.post.mockReturnValueOnce(of(response));
    const result = await firstValueFrom(
      service.downloadFileReports('slug', ['e1'])
    );
    expect(result).toBeNull();
    const [, body, options] = httpClient.post.mock.calls[0];
    expect(body).toEqual(['e1']);
    expect(options.observe).toBe('response');
    expect(options.responseType).toBe('blob');
  });

  it('sends the shown run filter with the spreadsheet request', async () => {
    httpClient.post.mockReturnValueOnce(
      of(new HttpResponse<Blob>({ body: null }))
    );
    await firstValueFrom(service.downloadFileReports('slug', ['e1'], 5));
    expect(httpClient.post).toHaveBeenCalledWith(
      `${environment.fileReportApiUrl}/download/slug`,
      ['e1'],
      expect.objectContaining({ params: { run: 5 } })
    );
  });

  it('downloadFileReports saves the blob using a temporary anchor and revokes the URL', async () => {
    const blob = new Blob(['xlsx-bytes']);
    const response = new HttpResponse<Blob>({
      body: blob,
      headers: new HttpHeaders({
        'content-disposition': 'attachment; filename="report-1.xlsx"'
      })
    });
    httpClient.post.mockReturnValueOnce(of(response));

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

    const result = await firstValueFrom(
      service.downloadFileReports('slug', ['e1'])
    );

    expect(result).toBe(response);
    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(anchor.download).toBe('report-1.xlsx');
    expect(click).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:fake');
  });

  it('downloadFileReports falls back to report.xlsx when no filename is provided', async () => {
    const blob = new Blob(['x']);
    const response = new HttpResponse<Blob>({
      body: blob,
      headers: new HttpHeaders()
    });
    httpClient.post.mockReturnValueOnce(of(response));
    const click = vi.fn();
    const anchor = {
      click,
      href: '',
      download: ''
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    await firstValueFrom(service.downloadFileReports('slug', ['e1']));
    expect(anchor.download).toBe('report.xlsx');
  });

  it('downloadFileReports falls back to null on error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.post.mockReturnValueOnce(throwError(() => new Error('boom')));
    expect(
      await firstValueFrom(service.downloadFileReports('slug', ['e1']))
    ).toBeNull();
  });
});
