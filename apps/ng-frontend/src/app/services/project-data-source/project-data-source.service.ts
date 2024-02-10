import { DataSource } from '@angular/cdk/collections';
import { ReportDetails } from '../../models/report.interface';
import { Observable, ReplaySubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProjectDataSourceService extends DataSource<ReportDetails> {
  private _dataStream = new ReplaySubject<ReportDetails[]>();

  constructor() {
    super();
  }

  connect(): Observable<ReportDetails[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: ReportDetails[]) {
    this._dataStream.next(data);
  }
}
