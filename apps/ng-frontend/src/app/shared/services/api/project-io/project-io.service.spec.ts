import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError, EMPTY } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ProjectIoService } from './project-io.service';

describe('ProjectIoService', () => {
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: ProjectIoService;

  beforeEach(() => {
    httpClient = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
    service = new ProjectIoService(httpClient as unknown as HttpClient);
  });

  afterEach(() => vi.restoreAllMocks());

  it('exportProject downloads the blob via a temporary anchor and revokes the URL', () => {
    const blob = new Blob(['payload']);
    httpClient.get.mockReturnValueOnce(of(blob));
    const click = vi.fn();
    const anchor = {
      click,
      href: '',
      download: ''
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const createSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:fake');
    const revokeSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);

    service.exportProject('my-slug');

    expect(httpClient.get).toHaveBeenCalledWith(
      `${environment.projectApiUrl}/export/my-slug`,
      { responseType: 'blob' }
    );
    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(anchor.download).toBe('my-slug.zip');
    expect(click).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:fake');
  });

  it('exportProject swallows errors and does not create an anchor', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('boom')));
    const createElement = vi.spyOn(document, 'createElement');
    service.exportProject('my-slug');
    expect(createElement).not.toHaveBeenCalled();
  });

  it('importProject returns EMPTY when no file is provided', () => {
    expect(service.importProject(null)).toBe(EMPTY);
  });

  it('importProject POSTs a multipart FormData payload with progress events', async () => {
    const file = new File(['data'], 'project.zip');
    httpClient.post.mockReturnValueOnce(of({ type: 1 }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const result = await firstValueFrom(service.importProject(file));
    expect(result).toEqual({ type: 1 });
    const [url, formData, options] = httpClient.post.mock.calls[0];
    expect(url).toBe(`${environment.projectApiUrl}/import`);
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get('file')).toBe(file);
    expect(options).toMatchObject({ reportProgress: true, observe: 'events' });
  });

  it('importProject re-throws errors after logging', async () => {
    const file = new File(['data'], 'project.zip');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.post.mockReturnValueOnce(throwError(() => new Error('bad')));
    await expect(firstValueFrom(service.importProject(file))).rejects.toThrow(
      'bad'
    );
  });

  it('deleteProject calls DELETE on the delete endpoint', async () => {
    httpClient.delete.mockReturnValueOnce(of({ ok: true }));
    const result = await firstValueFrom(service.deleteProject('foo'));
    expect(result).toEqual({ ok: true });
    expect(httpClient.delete).toHaveBeenCalledWith(
      `${environment.projectApiUrl}/delete/foo`
    );
  });
});
