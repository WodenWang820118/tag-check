import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { VideosService } from './videos.service';

describe('VideosService', () => {
  let service: VideosService;
  let http: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    http = { get: vi.fn() };
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    service = new VideosService(http as unknown as HttpClient);
  });

  it('returns the response body as the blob payload', async () => {
    const blob = new Blob(['v'], { type: 'video/mp4' });
    http.get.mockReturnValue(of({ body: blob }));
    const result = await firstValueFrom(service.getVideo('p', 'e'));
    expect(result.blob).toBe(blob);
    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('/p/e'),
      expect.objectContaining({ responseType: 'blob', observe: 'response' })
    );
  });

  it('falls back to an empty Blob when response body is missing', async () => {
    http.get.mockReturnValue(of({ body: null }));
    const result = await firstValueFrom(service.getVideo('p', 'e'));
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.size).toBe(0);
  });

  it('rethrows a friendly error when the HTTP call fails', async () => {
    http.get.mockReturnValue(throwError(() => new Error('boom')));
    await expect(firstValueFrom(service.getVideo('p', 'e'))).rejects.toThrow(
      'Failed to load video'
    );
  });
});
