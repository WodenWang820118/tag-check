import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  GTMConfiguration,
  GtmImportPreview,
  GtmImportResolution,
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

  /** Asks which tags changed event name. The server writes nothing. */
  previewGtmJson(projectSlug: string, json: GTMConfiguration) {
    return this.httpClient.post<GtmImportPreview>(
      `${environment.gtmParserApiUrl}/preview/${projectSlug}`,
      json
    );
  }

  /**
   * Uploads the container. When `resolutions` is set, each tag whose event
   * name changed is updated or kept alongside a new test.
   */
  uploadGtmJson(
    projectSlug: string,
    json: GTMConfiguration,
    resolutions?: Readonly<Record<string, GtmImportResolution>>
  ) {
    const body =
      resolutions === undefined ? json : { container: json, resolutions };
    return this.httpClient.post<GtmImportSummary>(
      `${environment.gtmParserApiUrl}/upload/${projectSlug}`,
      body
    );
  }
}
