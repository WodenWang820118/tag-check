import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DataLayerService {
  constructor(private http: HttpClient) {}

  runDataLayerCheck(projectSlug: string, eventName: string, headless?: string) {
    return this.http.get(
      `${environment.dataLayerApiUrl}/${projectSlug}/${eventName}?headless=${headless}`
    );
  }
}
