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

  it('round-trips temp/spec/loading signals', () => {
    const spec = { name: 'x' } as never;
    service.setTempSpec(spec);
    service.setSpec(spec);
    service.setLoading(true);
    expect(service.tempSpecContent$()).toBe(spec);
    expect(service.specContent$()).toBe(spec);
    expect(service.isLoading$()).toBe(true);
  });

  it('readSpecJsonFileContent parses JSON and clears loading after the timeout', async () => {
    vi.useFakeTimers();
    const file = { text: () => Promise.resolve('{"event":"a"}') } as File;
    service.readSpecJsonFileContent(file);
    expect(service.isLoading$()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.tempSpecContent$()).toEqual({ event: 'a' });
    vi.advanceTimersByTime(1000);
    expect(service.isLoading$()).toBe(false);
  });

  it('readSpecJsonFileContent sets temp to null on parse error', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const file = { text: () => Promise.resolve('not json') } as File;
    service.tempSpecContent.set({ event: 'old' } as never);
    service.readSpecJsonFileContent(file);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.tempSpecContent$()).toBeNull();
    vi.advanceTimersByTime(1000);
  });

  it('getSpecs hits the spec API and rethrows wrapped errors', async () => {
    httpClient.get.mockReturnValueOnce(of([{ id: 1 }] as never));
    await firstValueFrom(service.getSpecs());
    expect(httpClient.get).toHaveBeenCalledWith(environment.specApiUrl);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(firstValueFrom(service.getSpecs())).rejects.toThrow(
      'Failed to get specs'
    );
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
