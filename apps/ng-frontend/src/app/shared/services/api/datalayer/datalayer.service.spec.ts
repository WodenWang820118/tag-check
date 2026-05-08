import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DataLayerService } from './datalayer.service';

describe('DataLayerService', () => {
  let httpClient: { post: ReturnType<typeof vi.fn> };
  let service: DataLayerService;

  beforeEach(() => {
    httpClient = { post: vi.fn() };
    service = new DataLayerService(httpClient as unknown as HttpClient);
  });

  afterEach(() => vi.restoreAllMocks());

  it('runDataLayerInspection sends optional params via HttpParams', async () => {
    httpClient.post.mockReturnValueOnce(of([]));
    const preset = { name: 'p' } as never;
    await firstValueFrom(
      service.runDataLayerInspection('slug', 'evt', {
        websiteUrl: 'https://example.com/',
        headless: true,
        username: 'u',
        password: 'p',
        captureRequest: true,
        eventInspectionPreset: preset
      })
    );
    const [url, body, options] = httpClient.post.mock.calls[0];
    expect(url).toBe(`${environment.dataLayerApiUrl}/slug/evt`);
    expect(body).toBe(preset);
    const params = options.params as HttpParams;
    expect(params.get('url')).toBe('https://example.com/');
    expect(params.get('headless')).toBe('true');
    expect(params.get('username')).toBe('u');
    expect(params.get('password')).toBe('p');
    expect(params.get('captureRequest')).toBe('true');
  });

  it('runDataLayerInspection rethrows when no stop has been requested', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.post.mockReturnValueOnce(throwError(() => new Error('boom')));
    await expect(
      firstValueFrom(
        service.runDataLayerInspection('s', 'e', {
          websiteUrl: 'https://x.test'
        })
      )
    ).rejects.toMatch(/Error running data layer inspection/);
  });

  it('runDataLayerInspection swallows the error and resets the stop flag', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.post
      .mockReturnValueOnce(of({ status: 200, message: 'ok' }))
      .mockReturnValueOnce(throwError(() => new Error('boom')));
    await firstValueFrom(service.stopOperation());
    expect(service.isStopOperation$()).toBe(true);
    const result = await firstValueFrom(
      service.runDataLayerInspection('s', 'e', {
        websiteUrl: 'https://x.test'
      })
    );
    expect(result).toEqual([]);
    expect(service.isStopOperation$()).toBe(false);
  });

  it('stopOperation flips the signal only on status 200 and rethrows errors', async () => {
    httpClient.post.mockReturnValueOnce(of({ status: 500, message: 'no' }));
    await firstValueFrom(service.stopOperation());
    expect(service.isStopOperation$()).toBe(false);
    httpClient.post.mockReturnValueOnce(of({ status: 200, message: 'ok' }));
    await firstValueFrom(service.stopOperation());
    expect(service.isStopOperation$()).toBe(true);

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.post.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(firstValueFrom(service.stopOperation())).rejects.toThrow('x');
  });
});
