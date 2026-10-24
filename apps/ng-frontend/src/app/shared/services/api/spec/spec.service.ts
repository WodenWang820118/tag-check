import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { rethrowHttpError } from '../http-error.utils';
import { DataLayerSpec, ProjectSpec, StrictDataLayerEvent } from '@utils';
import { environment } from '../../../../../environments/environment';

export type UpdateSpecRequest = {
  event: string;
  dataLayerSpec: StrictDataLayerEvent;
};

/** Reads and saves the specs: the dataLayer push each test expects. */
@Injectable({
  providedIn: 'root'
})
export class SpecService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves the spec for a single project.
   *
   * @param projectSlug - URL-friendly project identifier.
   */
  getProjectSpec(projectSlug: string) {
    return this.http
      .get<ProjectSpec>(`${environment.specApiUrl}/${projectSlug}`)
      .pipe(rethrowHttpError('Failed to get project specs'));
  }

  /**
   * Persists an updated spec event for a project.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param eventName   - Name of the event to update.
   * @param content     - Spec payload to write.
   */
  updateSpec(
    projectSlug: string,
    eventName: string,
    content: UpdateSpecRequest
  ) {
    return this.http
      .put(`${environment.specApiUrl}/${projectSlug}/${eventName}`, {
        ...content
      })
      .pipe(rethrowHttpError('Failed to update spec'));
  }

  /**
   * Retrieves the data-layer spec for a specific test event.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param eventId     - Test event identifier.
   */
  getEventSpec(
    projectSlug: string,
    eventId: string
  ): Observable<DataLayerSpec> {
    return this.http
      .get<DataLayerSpec>(`${environment.specApiUrl}/${projectSlug}/${eventId}`)
      .pipe(rethrowHttpError('Failed to get spec details'));
  }
}
