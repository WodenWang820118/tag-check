import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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

  it('a failed save shows the Error snackbar and still fails', async () => {
    const failure = new HttpErrorResponse({ status: 500 });
    httpClient.put.mockReturnValueOnce(throwError(() => failure));
    await expect(
      firstValueFrom(service.updateBrowserSetting('s', {} as never))
    ).rejects.toBe(failure);
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
});
