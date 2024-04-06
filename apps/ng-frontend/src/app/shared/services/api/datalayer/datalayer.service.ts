import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { IInspectEvent } from '../../../models/inspectData.interface';

@Injectable({
  providedIn: 'root',
})
export class DataLayerService {
  constructor(private http: HttpClient) {}

  runDataLayerInspection(
    projectSlug: string,
    eventName: string,
    headless?: boolean,
    inspectEventDto?: IInspectEvent,
    username?: string,
    password?: string
  ) {
    const queryParams = [];
    if (headless !== undefined) queryParams.push(`headless=${headless}`);
    if (username) queryParams.push(`username=${username}`);
    if (password) queryParams.push(`password=${password}`);
    const queryString = queryParams.length ? '?' + queryParams.join('&') : '';

    return this.http.post(
      `${environment.dataLayerApiUrl}/${projectSlug}/${eventName}${queryString}`,
      inspectEventDto
    );
  }
}
