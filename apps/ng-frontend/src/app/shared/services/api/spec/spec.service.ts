import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, map } from 'rxjs';
import { Spec } from '../../../models/spec.interface';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpecService {
  mockUrl = 'http://localhost:3003/specs';

  currentSpec: Subject<Spec> = new BehaviorSubject({} as Spec);
  currentSpec$ = this.currentSpec.asObservable();

  constructor(private http: HttpClient) {}

  getSpecs() {
    return this.http.get<Spec[]>(environment.specApiUrl);
  }

  getSpec(projectSlug: string, eventName: string) {
    return this.http.get<Spec>(`${environment.specApiUrl}/${projectSlug}`).pipe(
      map((project) => {
        return project.specs.find((spec) => spec.event === eventName);
      })
    );
  }

  addSpec(projectSlug: string, content: string) {
    const jsonContent = JSON.parse(content);
    console.log('Project Slug', projectSlug);
    console.log('Spec', jsonContent);
    return this.http.post(`${environment.specApiUrl}/${projectSlug}`, {
      data: jsonContent,
    });
  }

  updateSpec(projectSlug: string, eventName: string, content: string) {
    const jsonContent = JSON.parse(content);
    return this.http.put(
      `${environment.specApiUrl}/${projectSlug}/${eventName}`,
      {
        data: jsonContent,
      }
    );
  }
}