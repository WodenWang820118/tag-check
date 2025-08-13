import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { SysConfiguration } from '@utils';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
/**
 * This service will communicate with SQLite3 databases
 */
export class ConfigurationService {
  rootSubject = new BehaviorSubject('');
  root$ = this.rootSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getConfigurations() {
    return this.http
      .get<SysConfiguration[]>(environment.configurationApiUrl)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of([]);
        })
      );
  }

  getConfiguration(name: string) {
    return this.http
      .get<SysConfiguration>(`${environment.configurationApiUrl}/${name}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  resetConfiguration(name: string) {
    return this.http
      .delete(`${environment.configurationApiUrl}/reset/${name}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  createConfiguration(configuration: SysConfiguration) {
    return this.http
      .post(`${environment.configurationApiUrl}/create`, configuration)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }
}
