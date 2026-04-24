import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GTMConfiguration, isGTMConfiguration } from '@utils';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GtmJsonParserService {
  constructor(private readonly httpClient: HttpClient) {}

  parseGtmJson(json: string) {
    const result = JSON.parse(json) as unknown;
    if (!isGTMConfiguration(result)) {
      throw new Error('Invalid GTM configuration JSON.');
    }
    return result;
  }

  uploadGtmJson(projectSlug: string, json: GTMConfiguration) {
    return this.httpClient.post(
      `${environment.gtmParserApiUrl}/upload/${projectSlug}`,
      json
    );
  }
}
