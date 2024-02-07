import { DataSource } from '@angular/cdk/collections';
import { TestCase } from '../../models/project.interface';
import { Observable, ReplaySubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProjectDataSourceService extends DataSource<TestCase> {
  private _dataStream = new ReplaySubject<TestCase[]>();

  constructor() {
    super();
  }

  connect(): Observable<TestCase[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: TestCase[]) {
    this._dataStream.next(data);
  }
}
