import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { RecordingService } from './recording.service';

describe('RecordingService', () => {
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };
  let service: RecordingService;

  beforeEach(() => {
    httpClient = { get: vi.fn(), put: vi.fn() };
    service = new RecordingService(httpClient as unknown as HttpClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('round-trips temp/recording/loading signals', () => {
    const recording = { name: 'r' } as never;
    service.setTempRecording(recording);
    service.setRecording(recording);
    service.setLoading(true);
    expect(service.tempRecordingContent$()).toBe(recording);
    expect(service.recordingContent$()).toBe(recording);
    expect(service.isLoading$()).toBe(true);
  });

  it('readRecordingJsonFileContent parses JSON content into the temp signal and clears loading', async () => {
    vi.useFakeTimers();
    const file = {
      text: () => Promise.resolve('{"name":"foo"}')
    } as File;
    service.readRecordingJsonFileContent(file);
    expect(service.isLoading$()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.tempRecordingContent$()).toEqual({ name: 'foo' });
    vi.advanceTimersByTime(1000);
    expect(service.isLoading$()).toBe(false);
  });

  it('readRecordingJsonFileContent sets temp to null when JSON.parse throws', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const file = { text: () => Promise.resolve('not json') } as File;
    service.tempRecordingContent.set({ name: 'old' } as never);
    service.readRecordingJsonFileContent(file);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.tempRecordingContent$()).toBeNull();
    vi.advanceTimersByTime(1000);
    expect(service.isLoading$()).toBe(false);
  });

  it('getProjectRecordings returns the response and falls back to null on error', async () => {
    httpClient.get.mockReturnValueOnce(of([{ id: 1 }] as never));
    expect(await firstValueFrom(service.getProjectRecordings('slug'))).toEqual([
      { id: 1 }
    ]);
    expect(httpClient.get).toHaveBeenCalledWith(
      `${environment.recordingApiUrl}/slug`
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    expect(
      await firstValueFrom(service.getProjectRecordings('slug'))
    ).toBeNull();
  });

  it('getProjectRecordingNames falls back to [] on error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    expect(await firstValueFrom(service.getProjectRecordingNames('s'))).toEqual(
      []
    );
  });

  it('getRecordingDetails short-circuits when projectSlug or eventId is missing', async () => {
    expect(
      await firstValueFrom(service.getRecordingDetails('', 'evt'))
    ).toEqual({});
    expect(
      await firstValueFrom(service.getRecordingDetails('slug', ''))
    ).toEqual({});
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('getRecordingDetails rethrows wrapped errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(
      firstValueFrom(service.getRecordingDetails('slug', 'evt'))
    ).rejects.toThrow('Failed to get recording details');
  });

  it('updateRecording PUTs the body and rethrows wrapped errors', async () => {
    httpClient.put.mockReturnValueOnce(of({ name: 'r' } as never));
    const result = await firstValueFrom(
      service.updateRecording('slug', 'evt', { name: 'r' } as never)
    );
    expect(result).toEqual({ name: 'r' });
    expect(httpClient.put).toHaveBeenCalledWith(
      `${environment.recordingApiUrl}/slug/evt`,
      { name: 'r' }
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.put.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(
      firstValueFrom(service.updateRecording('slug', 'evt', {} as never))
    ).rejects.toThrow('Failed to update recording');
  });
});
