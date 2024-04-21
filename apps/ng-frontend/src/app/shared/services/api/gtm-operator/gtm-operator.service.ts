import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { EventInspectionPreset } from '@utils';

@Injectable({
  providedIn: 'root',
})
export class GtmOperatorService {
  constructor(private http: HttpClient) {}

  runInspectionViaGtm(
    projectSlug: string,
    eventId: string,
    gtmUrl: string,
    headless?: boolean,
    eventInspectionPreset?: EventInspectionPreset,
    measurmentId?: string,
    username?: string,
    password?: string
  ) {
    const encodedGtmUrl = encodeURIComponent(gtmUrl);
    const queryParams = [`gtmUrl=${encodedGtmUrl}`];

    if (headless !== undefined) queryParams.push(`headless=${headless}`);
    if (measurmentId) queryParams.push(`measurementId=${measurmentId}`);
    if (username) queryParams.push(`username=${encodeURIComponent(username)}`);
    if (password) queryParams.push(`password=${encodeURIComponent(password)}`);

    const queryString = queryParams.join('&');

    return this.http.post(
      `${environment.dataLayerApiUrl}/gtm-operator/${projectSlug}/${eventId}?${queryString}`,
      eventInspectionPreset
    );
  }
}
