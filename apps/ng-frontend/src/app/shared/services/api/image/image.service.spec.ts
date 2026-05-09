import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { ImageService } from './image.service';

describe('ImageService', () => {
  let service: ImageService;
  let http: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    http = { get: vi.fn() };
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    service = new ImageService(http as unknown as HttpClient);
  });

  it('requests the image endpoint with image/png accept and blob response', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    http.get.mockReturnValue(of({ body: blob }));

    const result = await firstValueFrom(service.getImage('p', 'e'));

    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('/p/e'),
      expect.objectContaining({
        responseType: 'blob',
        observe: 'response',
        headers: expect.objectContaining({ Accept: 'image/png' })
      })
    );
    expect(result.blob).toBe(blob);
  });

  it('falls back to an empty Blob when response has no body', async () => {
    http.get.mockReturnValue(of({ body: null }));
    const result = await firstValueFrom(service.getImage('p', 'e'));
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.size).toBe(0);
  });
});
