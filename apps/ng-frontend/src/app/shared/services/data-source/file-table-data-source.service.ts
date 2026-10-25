import { DataSource } from '@angular/cdk/collections';
import { Jsonified, RunSummary } from '@utils';
import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable, signal } from '@angular/core';

/**
 * Requests from the Reports page's toolbar to its table: the filter text,
 * the event filter, and delete or download flags that FileTableDataSourceFacadeService
 * handles and resets.
 */
@Injectable({
  providedIn: 'root'
})
export class FileTableDataSourceService extends DataSource<
  Jsonified<RunSummary>
> {
  private readonly _dataStream = new BehaviorSubject<Jsonified<RunSummary>[]>(
    []
  );
  private readonly _filterSignal = signal<string>('');
  private readonly _eventFilterSignal = signal<string>('');
  private readonly _deletedSignal = signal<boolean>(false);
  private readonly _downloadSignal = signal<boolean>(false);

  constructor() {
    super();
  }

  connect(): Observable<Jsonified<RunSummary>[]> {
    return this._dataStream;
  }

  disconnect() {
    this._dataStream.complete();
  }

  setData(data: Jsonified<RunSummary>[]) {
    this._dataStream.next(data);
  }

  getData(): Observable<Jsonified<RunSummary>[]> {
    return this._dataStream;
  }

  setFilterSignal(filter: string) {
    this._filterSignal.set(filter);
  }

  getFilterSignal() {
    return this._filterSignal();
  }

  /** The event whose runs are listed (`?event=`); empty for every run. */
  setEventFilterSignal(eventName: string) {
    this._eventFilterSignal.set(eventName);
  }

  getEventFilterSignal() {
    return this._eventFilterSignal();
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
