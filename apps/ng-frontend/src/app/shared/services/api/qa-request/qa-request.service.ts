import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { IInspectEvent } from '../../../models/inspectData.interface';

@Injectable({
  providedIn: 'root',
})
export class QaRequestService {
  constructor(private http: HttpClient) {}

  runDataLayerWithRequestCheck(
    projectSlug: string,
    eventName: string,
    measurementId: string,
    headless?: boolean,
    inspectEventDto?: IInspectEvent,
    username?: string,
    password?: string
  ) {
    // console.log('runDataLayerCheck', projectSlug, eventName, headless);
    // console.log('inspectEventDto', inspectEventDto);
    const queryParams = [];
    if (measurementId) queryParams.push(`measurementId=${measurementId}`);
    if (headless !== undefined) queryParams.push(`headless=${headless}`);
    if (username) queryParams.push(`username=${username}`);
    if (password) queryParams.push(`password=${password}`);
    const queryString = queryParams.length ? '?' + queryParams.join('&') : '';
    return this.http.post(
      `${environment.dataLayerApiUrl}/${projectSlug}/${eventName}${queryString}`,
      { inspectEventDto: inspectEventDto ? inspectEventDto : {} }
    );
  }
}