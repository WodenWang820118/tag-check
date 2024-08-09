import { DataSource } from '@angular/cdk/collections';
import { FileReport } from '@utils';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileTableDataSourceService extends DataSource<FileReport> {
  private _dataStream = new BehaviorSubject<FileReport[]>([]);
  private _filterStream = new ReplaySubject<string>();
  private _deletedStream = new BehaviorSubject<boolean>(false);
  private _downloadStream = new BehaviorSubject<boolean>(false);

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

  setDownloadStream(download: boolean) {
    this._downloadStream.next(download);
  }

  downloadSelected() {
    this.setDownloadStream(true);
  }

  getDownloadStream(): Observable<boolean> {
    return this._downloadStream;
  }
}
