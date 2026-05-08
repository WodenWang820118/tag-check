import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ConfigurationService } from './configuration.service';

describe('ConfigurationService', () => {
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: ConfigurationService;

  beforeEach(() => {
    httpClient = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
    service = new ConfigurationService(httpClient as unknown as HttpClient);
  });

  afterEach(() => vi.restoreAllMocks());

  it('getConfigurations returns response and falls back to [] on error', async () => {
    httpClient.get.mockReturnValueOnce(of([{ id: 1 }]));
    expect(await firstValueFrom(service.getConfigurations())).toEqual([
      { id: 1 }
    ]);
    expect(httpClient.get).toHaveBeenCalledWith(
      environment.configurationApiUrl
    );

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('boom')));
    expect(await firstValueFrom(service.getConfigurations())).toEqual([]);
  });

  it('getConfiguration uses the name in the URL and falls back to null on error', async () => {
    httpClient.get.mockReturnValueOnce(of({ id: 2, name: 'foo' }));
    const result = await firstValueFrom(service.getConfiguration('foo'));
    expect(result).toEqual({ id: 2, name: 'foo' });
    expect(httpClient.get).toHaveBeenCalledWith(
      `${environment.configurationApiUrl}/foo`
    );

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    expect(await firstValueFrom(service.getConfiguration('foo'))).toBeNull();
  });

  it('resetConfiguration calls DELETE on the reset endpoint', async () => {
    httpClient.delete.mockReturnValueOnce(of({ ok: true }));
    const result = await firstValueFrom(service.resetConfiguration('foo'));
    expect(result).toEqual({ ok: true });
    expect(httpClient.delete).toHaveBeenCalledWith(
      `${environment.configurationApiUrl}/reset/foo`
    );
  });

  it('createConfiguration POSTs the body to the create endpoint', async () => {
    const body = { id: 0, name: 'new' } as never;
    httpClient.post.mockReturnValueOnce(of({ id: 3 }));
    const result = await firstValueFrom(service.createConfiguration(body));
    expect(result).toEqual({ id: 3 });
    expect(httpClient.post).toHaveBeenCalledWith(
      `${environment.configurationApiUrl}/create`,
      body
    );
  });
});
