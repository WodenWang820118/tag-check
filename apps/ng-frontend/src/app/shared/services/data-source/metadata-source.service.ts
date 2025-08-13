import { DataSource } from '@angular/cdk/collections';
import { Project } from '@utils';
import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MetadataSourceService extends DataSource<Project> {
  private readonly _dataStream = new BehaviorSubject<Project[]>([]);
  private readonly _filterSignal = signal<string>('');

  constructor() {
    super();
  }

  connect(): Observable<Project[]> {
    return this._dataStream;
  }

  disconnect() {
    this._dataStream.complete();
    this._filterSignal.set('');
  }

  setData(data: Project[]) {
    this._dataStream.next(data);
  }

  getData(): Observable<Project[]> {
    return this._dataStream;
  }

  setFilterSignal(filter: string) {
    this._filterSignal.set(filter);
  }

  getFilterSignal() {
    return this._filterSignal();
  }
}
