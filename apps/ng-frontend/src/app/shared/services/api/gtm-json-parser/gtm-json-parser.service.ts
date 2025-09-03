import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GTMConfiguration } from '@utils';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GtmJsonParserService {
  constructor(private readonly httpClient: HttpClient) {}

  parseGtmJson(json: string) {
    const result = JSON.parse(json) as GTMConfiguration;
    return result;
  }

  uploadGtmJson(projectSlug: string, json: string) {
    return this.httpClient.post(
      `${environment.gtmParserApiUrl}/upload/${projectSlug}`,
      json
    );
  }
}
