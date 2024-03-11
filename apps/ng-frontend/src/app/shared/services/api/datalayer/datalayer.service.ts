import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { InspectEvent } from '../../../models/inspectData.interface';

@Injectable({
  providedIn: 'root',
})
export class DataLayerService {
  constructor(private http: HttpClient) {}

  runDataLayerCheck(
    projectSlug: string,
    eventName: string,
    headless?: boolean,
    inspectEventDto?: InspectEvent
  ) {
    // console.log('runDataLayerCheck', projectSlug, eventName, headless);
    // console.log('inspectEventDto', inspectEventDto);
    return this.http.post(
      `${environment.dataLayerApiUrl}/${projectSlug}/${eventName}?headless=${headless}`,
      {
        inspectEventDto: inspectEventDto ? inspectEventDto : {},
      }
    );
  }
}
