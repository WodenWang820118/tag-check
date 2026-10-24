import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpecService } from './spec.service';

describe('SpecService', () => {
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };
  let service: SpecService;

  beforeEach(() => {
    httpClient = { get: vi.fn(), put: vi.fn() };
    service = new SpecService(httpClient as unknown as HttpClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('getProjectSpec rethrows wrapped errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(firstValueFrom(service.getProjectSpec('s'))).rejects.toThrow(
      'Failed to get project specs'
    );
  });

  it('updateSpec PUTs the body to /:slug/:event', async () => {
    httpClient.put.mockReturnValueOnce(of({ ok: true }));
    const body = { event: 'a', dataLayerSpec: {} as never };
    await firstValueFrom(service.updateSpec('slug', 'evt', body));
    expect(httpClient.put).toHaveBeenCalledWith(
      `${environment.specApiUrl}/slug/evt`,
      { ...body }
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.put.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(
      firstValueFrom(service.updateSpec('slug', 'evt', body))
    ).rejects.toThrow('Failed to update spec');
  });

  it('getEventSpec rethrows wrapped errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(
      firstValueFrom(service.getEventSpec('slug', 'evt'))
    ).rejects.toThrow('Failed to get spec details');
  });
});
