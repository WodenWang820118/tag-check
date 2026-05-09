import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { GtmOperatorService } from './gtm-operator.service';

describe('GtmOperatorService', () => {
  let httpClient: { post: ReturnType<typeof vi.fn> };
  let service: GtmOperatorService;

  beforeEach(() => {
    httpClient = { post: vi.fn() };
    service = new GtmOperatorService(httpClient as unknown as HttpClient);
  });

  afterEach(() => vi.restoreAllMocks());

  it('runInspectionViaGtm always sends headless=false and url-encodes credentials', async () => {
    httpClient.post.mockReturnValueOnce(of([]));
    await firstValueFrom(
      service.runInspectionViaGtm('slug', 'evt', {
        gtmUrl: 'https://gtm.example/?id=GTM-1',
        headless: true,
        measurementId: 'G-1',
        username: 'u@x.com',
        password: 'p+s',
        captureRequest: true,
        eventInspectionPreset: { name: 'preset' } as never
      })
    );
    const [url, body] = httpClient.post.mock.calls[0];
    expect(url).toBe(
      `${environment.dataLayerApiUrl}/gtm-operator/slug/evt?gtmUrl=${encodeURIComponent(
        'https://gtm.example/?id=GTM-1'
      )}&headless=false&measurementId=G-1&username=${encodeURIComponent(
        'u@x.com'
      )}&password=${encodeURIComponent('p+s')}&captureRequest=true`
    );
    expect(body).toEqual({ name: 'preset' });
  });

  it('runInspectionViaGtm omits optional params when not set', async () => {
    httpClient.post.mockReturnValueOnce(of([]));
    await firstValueFrom(
      service.runInspectionViaGtm('slug', 'evt', {
        gtmUrl: 'https://x.test'
      } as never)
    );
    const [url] = httpClient.post.mock.calls[0];
    expect(url).toBe(
      `${environment.dataLayerApiUrl}/gtm-operator/slug/evt?gtmUrl=${encodeURIComponent(
        'https://x.test'
      )}`
    );
  });

  it('runInspectionViaGtm rethrows when no stop has been requested', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.post.mockReturnValueOnce(throwError(() => new Error('boom')));
    await expect(
      firstValueFrom(
        service.runInspectionViaGtm('s', 'e', {
          gtmUrl: 'x'
        } as never)
      )
    ).rejects.toThrow('GTM inspection failed');
  });

  it('runInspectionViaGtm returns [] after stopOperation succeeded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    httpClient.post
      .mockReturnValueOnce(of({ status: 200, message: 'ok' }))
      .mockReturnValueOnce(throwError(() => new Error('boom')));
    await firstValueFrom(service.stopOperation());
    expect(service.isStopOperation$()).toBe(true);
    const result = await firstValueFrom(
      service.runInspectionViaGtm('s', 'e', { gtmUrl: 'x' } as never)
    );
    expect(result).toEqual([]);
  });

  it('stopOperation only flips on status 200 and rethrows errors', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.post.mockReturnValueOnce(of({ status: 500, message: 'no' }));
    await firstValueFrom(service.stopOperation());
    expect(service.isStopOperation$()).toBe(false);
    httpClient.post.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(firstValueFrom(service.stopOperation())).rejects.toThrow('x');
  });
});
