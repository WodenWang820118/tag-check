import { DataSource } from '@angular/cdk/collections';
import { FileReport } from '@utils';
import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileTableDataSourceService extends DataSource<FileReport> {
  private _dataStream = new BehaviorSubject<FileReport[]>([]);
  private _filterSignal = signal<string>('');
  private _deletedSignal = signal<boolean>(false);
  private _downloadSignal = signal<boolean>(false);

  constructor() {
    super();
  }

  connect(): Observable<FileReport[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: FileReport[]) {
    this._dataStream.next(data);
  }

  getData(): Observable<FileReport[]> {
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
