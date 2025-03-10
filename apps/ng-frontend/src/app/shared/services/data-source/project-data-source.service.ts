import { DataSource } from '@angular/cdk/collections';
import { IReportDetails } from '@utils';
import { BehaviorSubject } from 'rxjs';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProjectDataSourceService extends DataSource<IReportDetails> {
  private _dataStream = new BehaviorSubject<IReportDetails[]>([]);
  private _filterSignal = signal('');
  private _preventNavigationSignal = signal(false);
  private _deletedSignal = signal(false);

  constructor() {
    super();
  }

  connect() {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: IReportDetails[]) {
    this._dataStream.next(data);
  }

  setFilterSignal(filter: string) {
    this._filterSignal.set(filter);
  }

  getFilterSignal() {
    return this._filterSignal();
  }

  setPreventNavigationSignal(prevent: boolean) {
    this._preventNavigationSignal.set(prevent);
  }

  getPreventNavigationSignal() {
    return this._preventNavigationSignal();
  }

  setDeletedSignal(deleted: boolean) {
    this._deletedSignal.set(deleted);
  }

  getDeletedSignal() {
    return this._deletedSignal();
  }
}
