import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  GTMConfiguration,
  GtmImportSummary,
  parseGtmContainerExport
} from '@utils';
import { environment } from '../../../../../environments/environment';

/** Checks a GTM container export and uploads it, which creates tests. */
@Injectable({
  providedIn: 'root'
})
export class GtmJsonParserService {
  constructor(private readonly httpClient: HttpClient) {}

  /** Parses a Tag Manager container export; throws with a reason the user can act on. */
  parseGtmJson(json: string): GTMConfiguration {
    const { container, error } = parseGtmContainerExport(json);
    if (!container) {
      throw new Error(error);
    }
    return container;
  }

  uploadGtmJson(projectSlug: string, json: GTMConfiguration) {
    return this.httpClient.post<GtmImportSummary>(
      `${environment.gtmParserApiUrl}/upload/${projectSlug}`,
      json
    );
  }
}
