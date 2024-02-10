import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Configuration } from '../../../models/configuration.interface';

@Injectable({
  providedIn: 'root',
})
/**
 * This service will communicate with SQLite3 databases
 */
export class ConfigurationService {
  mockUrl = 'http://localhost:3002/configurations';

  rootSubject = new BehaviorSubject('');
  root$ = this.rootSubject.asObservable();

  constructor(private http: HttpClient) {}

  getConfigurations() {
    return this.http.get<Configuration[]>(this.mockUrl);
  }

  getConfiguration(name: string) {
    return this.http.get<Configuration>(`${this.mockUrl}/${name}`);
  }
}
