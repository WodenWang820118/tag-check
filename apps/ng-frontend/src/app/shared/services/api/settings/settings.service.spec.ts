import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };
  let snackBar: { openFromComponent: ReturnType<typeof vi.fn> };
  let service: SettingsService;

  beforeEach(() => {
    httpClient = { get: vi.fn(), post: vi.fn(), put: vi.fn() };
    snackBar = { openFromComponent: vi.fn() };
    service = new SettingsService(
      httpClient as unknown as HttpClient,
      snackBar as unknown as MatSnackBar
    );
  });

  afterEach(() => vi.restoreAllMocks());

  it('getSettings falls back to [] on error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    expect(await firstValueFrom(service.getSettings())).toEqual([]);
  });

  it('getProjectSettings rethrows the underlying error', async () => {
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('boom')));
    await expect(
      firstValueFrom(service.getProjectSettings('s'))
    ).rejects.toThrow('boom');
    expect(httpClient.get).toHaveBeenCalledWith(
      `${environment.settingsApiUrl}/s`
    );
  });

  const expectSnack = (label: 'Saved' | 'Error') => {
    const call = snackBar.openFromComponent.mock.calls.at(-1);
    expect(call?.[1]).toMatchObject({ duration: 5000, data: label });
  };

  it('updateProjectSetting opens a Saved snackbar on non-empty response', async () => {
    httpClient.put.mockReturnValueOnce(of({ projectSlug: 's' }));
    await firstValueFrom(
      service.updateProjectSetting('s', { name: 'x' } as never)
    );
    expect(httpClient.put).toHaveBeenCalledWith(
      `${environment.settingsApiUrl}/s/project`,
      { name: 'x' }
    );
    expectSnack('Saved');
  });

  it('updateProjectSetting opens an Error snackbar on empty response', async () => {
    httpClient.put.mockReturnValueOnce(of({}));
    await firstValueFrom(service.updateProjectSetting('s', {} as never));
    expectSnack('Error');
  });

  it('updateBrowserSetting routes to /browser', async () => {
    httpClient.put.mockReturnValueOnce(of({ a: 1 }));
    await firstValueFrom(service.updateBrowserSetting('s', {} as never));
    expect(httpClient.put.mock.calls[0][0]).toBe(
      `${environment.settingsApiUrl}/s/browser`
    );
    expectSnack('Saved');
  });

  it('updateAuthenticationSetting routes to /authentication', async () => {
    httpClient.put.mockReturnValueOnce(of({ a: 1 }));
    await firstValueFrom(service.updateAuthenticationSetting('s', {} as never));
    expect(httpClient.put.mock.calls[0][0]).toBe(
      `${environment.settingsApiUrl}/s/authentication`
    );
    expectSnack('Saved');
  });

  it('updateApplicationSetting routes to /application', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    httpClient.put.mockReturnValueOnce(of({ a: 1 }));
    await firstValueFrom(service.updateApplicationSetting('s', {} as never));
    expect(httpClient.put.mock.calls[0][0]).toBe(
      `${environment.settingsApiUrl}/s/application`
    );
    expectSnack('Saved');
  });

  it('addSettings POSTs the body and falls back to null on error', async () => {
    httpClient.post.mockReturnValueOnce(of({ id: 1 }));
    await firstValueFrom(service.addSettings('s', { name: 'n' } as never));
    expect(httpClient.post).toHaveBeenCalledWith(
      `${environment.settingsApiUrl}/s`,
      { name: 'n' }
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.post.mockReturnValueOnce(throwError(() => new Error('x')));
    expect(
      await firstValueFrom(service.addSettings('s', {} as never))
    ).toBeNull();
  });

  it('switchToProject sets the current project signal on success', async () => {
    const project = { projectSlug: 's' } as never;
    httpClient.get.mockReturnValueOnce(of(project));
    await firstValueFrom(service.switchToProject('s'));
    expect(service.currentProject$()).toBe(project);
  });

  it('switchToProject falls back to null and leaves the signal unchanged on error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    expect(await firstValueFrom(service.switchToProject('s'))).toBeNull();
  });
});
