import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SysConfiguration } from '@utils';
import { environment } from '../../../../../environments/environment';
import { catchHttpError } from '../http-error.utils';

/**
 * Provides read/write access to system-wide {@link SysConfiguration} entries
 * stored in the backend SQLite3 database.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches all system configurations.
   *
   * Returns `[]` on HTTP failure so the UI can treat a missing config list
   * as empty rather than crashing.
   */
  getConfigurations() {
    return this.http
      .get<SysConfiguration[]>(environment.configurationApiUrl)
      .pipe(catchHttpError([] as SysConfiguration[]));
  }

  /**
   * Fetches a single configuration entry by name.
   *
   * Returns `null` on HTTP failure.
   *
   * @param name - Configuration key name.
   */
  getConfiguration(name: string) {
    return this.http
      .get<SysConfiguration>(`${environment.configurationApiUrl}/${name}`)
      .pipe(catchHttpError(null));
  }

  /**
   * Resets a configuration entry to its default value.
   *
   * Returns `null` on HTTP failure.
   *
   * @param name - Configuration key name to reset.
   */
  resetConfiguration(name: string) {
    return this.http
      .delete(`${environment.configurationApiUrl}/reset/${name}`)
      .pipe(catchHttpError(null));
  }

  /**
   * Creates a new configuration entry.
   *
   * Returns `null` on HTTP failure.
   *
   * @param configuration - The configuration record to persist.
   */
  createConfiguration(configuration: SysConfiguration) {
    return this.http
      .post(`${environment.configurationApiUrl}/create`, configuration)
      .pipe(catchHttpError(null));
  }
}
