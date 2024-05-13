import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of, Subject } from 'rxjs';
import { ProjectSpec, Spec } from '@utils';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpecService {
  currentSpec: Subject<Spec> = new BehaviorSubject({} as Spec);
  currentSpec$ = this.currentSpec.asObservable();

  constructor(private http: HttpClient) {}

  getSpecs() {
    return this.http.get<ProjectSpec[]>(environment.specApiUrl).pipe(
      catchError((error) => {
        console.error(error);
        return [];
      })
    );
  }

  getProjectSpec(projectSlug: string) {
    return this.http
      .get<ProjectSpec>(`${environment.specApiUrl}/${projectSlug}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  getSpec(projectSlug: string, eventName: string) {
    return this.http
      .get<Spec>(`${environment.specApiUrl}/${projectSlug}/${eventName}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  addSpec(projectSlug: string, content: string) {
    const jsonContent = JSON.parse(content);
    console.log('Project Slug', projectSlug);
    console.log('Spec', jsonContent);
    return this.http
      .post(`${environment.specApiUrl}/${projectSlug}`, {
        data: jsonContent,
      })
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  updateSpec(projectSlug: string, eventName: string, content: string) {
    const jsonContent = JSON.parse(content);
    return this.http
      .put(`${environment.specApiUrl}/${projectSlug}/${eventName}`, {
        data: jsonContent,
      })
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }
}
