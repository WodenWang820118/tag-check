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
