import { DataSource } from '@angular/cdk/collections';
import { ProjectInfo } from '@utils';
import { BehaviorSubject, Observable, ReplaySubject, take, tap } from 'rxjs';
import { Injectable } from '@angular/core';
import { ProjectInfoService } from '../api/project-info/project-info.service';

@Injectable({
  providedIn: 'root',
})
export class MetadataSourceService extends DataSource<ProjectInfo> {
  private _dataStream = new BehaviorSubject<ProjectInfo[]>([]);
  private _filterStream = new ReplaySubject<string>();

  constructor(private projectInforService: ProjectInfoService) {
    super();
    this.initMetadata();
  }

  initMetadata() {
    this.projectInforService
      .getProjects()
      .pipe(
        take(1),
        tap((projects) => {
          this.setData(projects);
        })
      )
      .subscribe();
  }

  connect(): Observable<ProjectInfo[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: ProjectInfo[]) {
    this._dataStream.next(data);
  }

  getData(): Observable<ProjectInfo[]> {
    return this._dataStream;
  }

  getFilterStream(): Observable<string> {
    return this._filterStream;
  }

  setFilter(filter: string) {
    this._filterStream.next(filter);
  }
}
