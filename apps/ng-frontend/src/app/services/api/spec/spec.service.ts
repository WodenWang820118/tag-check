import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, map } from 'rxjs';
import { Spec } from '../../../models/spec.interface';
import { environment } from '../../../../environments/environment';
import { EditorService } from '../../editor/editor.service';

@Injectable({
  providedIn: 'root',
})
export class SpecService {
  // all RESTful API starts from base path: projects
  mockUrl = 'http://localhost:3003/specs';

  currentSpec: Subject<Spec> = new BehaviorSubject({} as Spec);
  currentSpec$ = this.currentSpec.asObservable();

  constructor(private http: HttpClient, private editorService: EditorService) {}

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
}
