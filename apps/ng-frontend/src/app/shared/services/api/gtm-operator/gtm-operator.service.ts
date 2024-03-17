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

    return this.http.post(
      `${environment.dataLayerApiUrl}/gtm-operator/${projectSlug}/${eventName}?gtmUrl=${encodedGtmUrl}&headless=${headless}?username=${username}?password=${password}`,
      {
        inspectEventDto: inspectEventDto ? inspectEventDto : {},
      }
    );
  }
}
