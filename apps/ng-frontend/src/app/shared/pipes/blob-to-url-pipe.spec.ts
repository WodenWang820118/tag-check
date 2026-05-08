import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { BlobToUrlPipe } from './blob-to-url-pipe';

describe('BlobToUrlPipe', () => {
  let pipe: BlobToUrlPipe;
  let sanitizer: { bypassSecurityTrustUrl: ReturnType<typeof vi.fn> };
  const originalCreateObjectURL = (URL as any).createObjectURL;

  beforeEach(() => {
    sanitizer = {
      bypassSecurityTrustUrl: vi.fn((u: string) => `safe:${u}`)
    };
    (URL as any).createObjectURL = vi.fn(() => 'blob:fake');
    TestBed.configureTestingModule({
      providers: [BlobToUrlPipe, { provide: DomSanitizer, useValue: sanitizer }]
    });
    pipe = TestBed.inject(BlobToUrlPipe);
  });

  afterEach(() => {
    (URL as any).createObjectURL = originalCreateObjectURL;
    vi.restoreAllMocks();
  });

  it('returns an empty string for null blobs', () => {
    expect(pipe.transform(null)).toBe('');
    expect(sanitizer.bypassSecurityTrustUrl).not.toHaveBeenCalled();
  });

  it('creates an object URL and bypasses sanitization for a blob', () => {
    const blob = new Blob(['x'], { type: 'text/plain' });
    const result = pipe.transform(blob);
    expect((URL as any).createObjectURL).toHaveBeenCalledWith(blob);
    expect(sanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith('blob:fake');
    expect(result).toBe('safe:blob:fake');
  });
});
