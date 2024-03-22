import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { IInspectEvent } from '../../../models/inspectData.interface';

@Injectable({
  providedIn: 'root',
})
export class GtmOperatorService {
  constructor(private http: HttpClient) {}

  runDataLayerCheckViaGtm(
    projectSlug: string,
    eventName: string,
    gtmUrl: string,
    headless?: boolean,
    inspectEventDto?: IInspectEvent,
    username?: string,
    password?: string
  ) {
    const encodedGtmUrl = encodeURIComponent(gtmUrl);
    const queryParams = [`gtmUrl=${encodedGtmUrl}`];

    if (headless !== undefined) queryParams.push(`headless=${headless}`);
    if (username) queryParams.push(`username=${encodeURIComponent(username)}`);
    if (password) queryParams.push(`password=${encodeURIComponent(password)}`);

    const queryString = queryParams.join('&');

    return this.http.post(
      `${environment.dataLayerApiUrl}/gtm-operator/${projectSlug}/${eventName}?${queryString}`,
      { inspectEventDto: inspectEventDto ? inspectEventDto : {} }
    );
  }
}
