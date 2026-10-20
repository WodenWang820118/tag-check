import { TestBed } from '@angular/core/testing';
import { BlobToUrlPipe } from './blob-to-url-pipe';

describe('BlobToUrlPipe', () => {
  let pipe: BlobToUrlPipe;
  const originalCreateObjectURL = (URL as any).createObjectURL;

  beforeEach(() => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:fake');
    TestBed.configureTestingModule({
      providers: [BlobToUrlPipe]
    });
    pipe = TestBed.inject(BlobToUrlPipe);
  });

  afterEach(() => {
    (URL as any).createObjectURL = originalCreateObjectURL;
    vi.restoreAllMocks();
  });

  it('returns an empty string for null blobs', () => {
    expect(pipe.transform(null)).toBe('');
    expect((URL as any).createObjectURL).not.toHaveBeenCalled();
  });

  it('returns the object URL as a plain string for a blob', () => {
    const blob = new Blob(['x'], { type: 'text/plain' });
    const result = pipe.transform(blob);
    expect((URL as any).createObjectURL).toHaveBeenCalledWith(blob);
    expect(result).toBe('blob:fake');
  });
});
