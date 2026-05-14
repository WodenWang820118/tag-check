import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, from, tap, finalize, of } from 'rxjs';
import { rethrowHttpError } from '../http-error.utils';
import { DataLayerSpec, ProjectSpec, StrictDataLayerEvent } from '@utils';
import { environment } from '../../../../../environments/environment';

export type UpdateSpecRequest = {
  event: string;
  dataLayerSpec: StrictDataLayerEvent;
};

@Injectable({
  providedIn: 'root'
})
export class SpecService {
  tempSpecContent = signal<DataLayerSpec | null>(null);
  tempSpecContent$ = computed(() => this.tempSpecContent());
  specContent = signal<DataLayerSpec | null>(null);
  specContent$ = computed(() => this.specContent());
  isLoading = signal(false);
  isLoading$ = computed(() => this.isLoading());

  constructor(private readonly http: HttpClient) {}

  setTempSpec(spec: DataLayerSpec | null) {
    this.tempSpecContent.set(spec);
  }

  setSpec(spec: DataLayerSpec | null) {
    this.specContent.set(spec);
  }

  setLoading(isLoading: boolean) {
    this.isLoading.set(isLoading);
  }

  readSpecJsonFileContent(file: File): void {
    this.setLoading(true);

    from(file.text())
      .pipe(
        tap((text) => {
          const fileContentString = String(text ?? '');
          try {
            this.tempSpecContent.set(JSON.parse(fileContentString));
          } catch (error) {
            console.error('Error parsing file content', error);
            this.tempSpecContent.set(null);
          }
        }),
        catchError((err) => {
          console.error('Error reading file content', err);
          this.tempSpecContent.set(null);
          return of(null);
        }),
        finalize(() => {
          setTimeout(() => {
            this.setLoading(false);
          }, 1000);
        })
      )
      .subscribe();
  }

  /**
   * Retrieves all project specs.
   *
   * @returns Observable of {@link ProjectSpec} array, or an error on failure.
   */
  getSpecs() {
    return this.http
      .get<ProjectSpec[]>(environment.specApiUrl)
      .pipe(rethrowHttpError('Failed to get specs'));
  }

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
