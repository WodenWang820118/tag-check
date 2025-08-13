import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { DataLayerSpec, ProjectSpec, Spec } from '@utils';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpecService {
  tempSpecContent = signal<Spec | null>(null);
  tempSpecContent$ = computed(() => this.tempSpecContent());
  specContent = signal<Spec | null>(null);
  specContent$ = computed(() => this.specContent());
  isLoading = signal(false);
  isLoading$ = computed(() => this.isLoading());

  constructor(private readonly http: HttpClient) {}

  setTempSpec(spec: Spec | null) {
    this.tempSpecContent.set(spec);
  }

  setSpec(spec: Spec | null) {
    this.specContent.set(spec);
  }

  setLoading(isLoading: boolean) {
    this.isLoading.set(isLoading);
  }

  readSpecJsonFileContent(file: File): void {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const fileContentString = e.target.result;

      try {
        this.tempSpecContent.set(JSON.parse(fileContentString));
        setTimeout(() => {
          this.setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error parsing file content', error);
      }
    };

    reader.onerror = () => {
      console.error('Error reading file content');
    };

    reader.readAsText(file);
  }

  getSpecs() {
    return this.http.get<ProjectSpec[]>(environment.specApiUrl).pipe(
      catchError((error) => {
        console.error(error);
        return throwError(() => new Error('Failed to get specs'));
      })
    );
  }

  getProjectSpec(projectSlug: string) {
    return this.http
      .get<ProjectSpec>(`${environment.specApiUrl}/${projectSlug}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(() => new Error('Failed to get project specs'));
        })
      );
  }

  updateSpec(projectSlug: string, eventName: string, content: Spec) {
    return this.http
      .put(`${environment.specApiUrl}/${projectSlug}/${eventName}`, {
        ...content
      })
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(() => new Error('Failed to update spec'));
        })
      );
  }

  getEventSpec(projectSlug: string, eventId: string): Observable<Spec> {
    return this.http
      .get<DataLayerSpec>(`${environment.specApiUrl}/${projectSlug}/${eventId}`)
      .pipe(
        map((spec) => {
          const transformedSpec: Spec = {
            event: spec.eventName,
            ...spec
          };
          console.log('Transformed Spec:', transformedSpec);
          return transformedSpec;
        }),
        catchError((error) => {
          console.error(error);
          return throwError(() => new Error('Failed to get spec details'));
        })
      );
  }
}
