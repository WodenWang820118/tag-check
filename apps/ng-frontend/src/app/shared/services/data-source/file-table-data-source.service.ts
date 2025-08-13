import { DataSource } from '@angular/cdk/collections';
import { IReportDetails, TestImage } from '@utils';
import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileTableDataSourceService extends DataSource<
  IReportDetails & TestImage
> {
  private readonly _dataStream = new BehaviorSubject<
    (IReportDetails & TestImage)[]
  >([]);
  private readonly _filterSignal = signal<string>('');
  private readonly _deletedSignal = signal<boolean>(false);
  private readonly _downloadSignal = signal<boolean>(false);

  constructor() {
    super();
  }

  connect(): Observable<(IReportDetails & TestImage)[]> {
    return this._dataStream;
  }

  disconnect() {
    this._dataStream.complete();
  }

  setData(data: (IReportDetails & TestImage)[]) {
    this._dataStream.next(data);
  }

  getData(): Observable<(IReportDetails & TestImage)[]> {
    return this._dataStream;
  }

  setFilterSignal(filter: string) {
    this._filterSignal.set(filter);
  }

  getFilterSignal() {
    return this._filterSignal();
  }

  setDeletedSignal(deleted: boolean) {
    this._deletedSignal.set(deleted);
  }

  getDeletedSignal() {
    return this._deletedSignal();
  }

  setDownloadSignal(download: boolean) {
    this._downloadSignal.set(download);
  }

  getDownloadSignal() {
    return this._downloadSignal();
  }
}
