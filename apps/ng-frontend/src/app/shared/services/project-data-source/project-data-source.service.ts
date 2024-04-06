import { DataSource } from '@angular/cdk/collections';
import { IReportDetails } from '../../../../../../../libs/utils/src/lib/interfaces/report.interface';
import { Observable, ReplaySubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProjectDataSourceService extends DataSource<IReportDetails> {
  private _dataStream = new ReplaySubject<IReportDetails[]>();
  private _filterStream = new ReplaySubject<string>();
  private _deletedStream = new ReplaySubject<boolean>();
  private _preventNavigationStream = new ReplaySubject<boolean>();

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

  getFilterStream(): Observable<string> {
    return this._filterStream;
  }

  setFilter(filter: string) {
    this._filterStream.next(filter);
  }

  setDeletedStream(deleted: boolean) {
    this._deletedStream.next(deleted);
  }

  deleteSelected() {
    this.setDeletedStream(true);
  }

  getDeletedStream(): Observable<boolean> {
    return this._deletedStream;
  }

  setPreventNavigationStream(prevent: boolean) {
    this._preventNavigationStream.next(prevent);
  }

  getPreventNavigationStream(): Observable<boolean> {
    return this._preventNavigationStream;
  }

  preventNavigationSelected() {
    this.setPreventNavigationStream(true);
  }
}
