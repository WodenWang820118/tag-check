import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from 'src/app/interfaces/project';

@Injectable({
  providedIn: 'root',
})
export class ProjectRetrieverService {
  localUrl: string = 'http://localhost:3000/projects';

  constructor(private http: HttpClient) {}

  getProjects() {
    return this.http.get<Project[]>(this.localUrl);
  }
}
