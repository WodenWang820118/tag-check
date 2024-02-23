import { DataSource } from '@angular/cdk/collections';
import { IReportDetails } from '../../models/report.interface';
import { Observable, ReplaySubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProjectDataSourceService extends DataSource<IReportDetails> {
  private _dataStream = new ReplaySubject<IReportDetails[]>();

  constructor() {
    super();
  }

  connect(): Observable<IReportDetails[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: IReportDetails[]) {
    this._dataStream.next(data);
  }
}
