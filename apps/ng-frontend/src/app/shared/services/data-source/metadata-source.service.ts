import { DataSource } from '@angular/cdk/collections';
import { ProjectInfo } from '@utils';
import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MetadataSourceService extends DataSource<ProjectInfo> {
  private _dataStream = new BehaviorSubject<ProjectInfo[]>([]);
  private _filterSignal = signal<string>('');

  constructor() {
    super();
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

  setFilterSignal(filter: string) {
    this._filterSignal.set(filter);
  }

  getFilterSignal() {
    return this._filterSignal();
  }
}
