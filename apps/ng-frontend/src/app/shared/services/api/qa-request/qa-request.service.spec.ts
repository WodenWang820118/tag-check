import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { QaRequestService } from './qa-request.service';

describe('QaRequestService', () => {
  let httpClient: { post: ReturnType<typeof vi.fn> };
  let service: QaRequestService;

  beforeEach(() => {
    httpClient = { post: vi.fn() };
    service = new QaRequestService(httpClient as unknown as HttpClient);
  });

  afterEach(() => vi.restoreAllMocks());

  it('runDataLayerWithRequestCheck POSTs without query string when no params are set', async () => {
    httpClient.post.mockReturnValueOnce(of([{ ok: true }]));
    const preset = { name: 'preset' } as never;
    const result = await firstValueFrom(
      service.runDataLayerWithRequestCheck('slug', 'evt', {
        eventInspectionPreset: preset
      } as never)
    );
    expect(result).toEqual([{ ok: true }]);
    expect(httpClient.post).toHaveBeenCalledWith(
      `${environment.dataLayerApiUrl}/slug/evt`,
      preset
    );
  });

  it('runDataLayerWithRequestCheck appends provided query parameters', async () => {
    httpClient.post.mockReturnValueOnce(of([]));
    await firstValueFrom(
      service.runDataLayerWithRequestCheck('slug', 'evt', {
        measurementId: 'G-1',
        headless: true,
        username: 'u',
        password: 'p',
        captureRequest: 'all',
        eventInspectionPreset: {} as never
      } as never)
    );
    const [url] = httpClient.post.mock.calls[0];
    expect(url).toBe(
      `${environment.dataLayerApiUrl}/slug/evt?measurementId=G-1&headless=true&username=u&password=p&captureRequest=all`
    );
  });

  it('runDataLayerWithRequestCheck swallows the error of a run that was stopped', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const run = new Subject<never>();
    httpClient.post
      .mockReturnValueOnce(run)
      .mockReturnValueOnce(of({ status: 200, message: 'ok' }));
    const result = firstValueFrom(
      service.runDataLayerWithRequestCheck('s', 'e', {
        eventInspectionPreset: {} as never
      } as never)
    );
    await firstValueFrom(service.stopOperation());
    expect(service.isStopOperation$()).toBe(true);
    run.error(new Error('boom'));
    expect(await result).toEqual([]);
  });

  it('runDataLayerWithRequestCheck reports the failure of a run started after a stop', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.post
      .mockReturnValueOnce(of({ status: 200, message: 'ok' }))
      .mockReturnValueOnce(throwError(() => new Error('boom')));
    await firstValueFrom(service.stopOperation());
    await expect(
      firstValueFrom(
        service.runDataLayerWithRequestCheck('s', 'e', {
          eventInspectionPreset: {} as never
        } as never)
      )
    ).rejects.toThrow('Data layer inspection failed');
  });

  it('runDataLayerWithRequestCheck rethrows when no stop has been requested', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.post.mockReturnValueOnce(throwError(() => new Error('boom')));
    await expect(
      firstValueFrom(
        service.runDataLayerWithRequestCheck('s', 'e', {
          eventInspectionPreset: {} as never
        } as never)
      )
    ).rejects.toThrow('Data layer inspection failed');
  });

  it('stopOperation flips the signal only when status is 200', async () => {
    httpClient.post.mockReturnValueOnce(of({ status: 500, message: 'no' }));
    await firstValueFrom(service.stopOperation());
    expect(service.isStopOperation$()).toBe(false);

    httpClient.post.mockReturnValueOnce(of({ status: 200, message: 'ok' }));
    await firstValueFrom(service.stopOperation());
    expect(service.isStopOperation$()).toBe(true);
  });

  it('stopOperation rethrows underlying errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.post.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(firstValueFrom(service.stopOperation())).rejects.toThrow('x');
  });
});
