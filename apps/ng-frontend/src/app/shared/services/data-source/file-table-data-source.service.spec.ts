import { firstValueFrom } from 'rxjs';
import { FileTableDataSourceService } from './file-table-data-source.service';

describe('FileTableDataSourceService', () => {
  let service: FileTableDataSourceService;

  beforeEach(() => {
    service = new FileTableDataSourceService();
  });

  it('connect emits the data set via setData', async () => {
    const rows = [{ eventName: 'a' }, { eventName: 'b' }] as never;
    service.setData(rows);
    expect(await firstValueFrom(service.connect())).toEqual(rows);
    expect(await firstValueFrom(service.getData())).toEqual(rows);
  });

  it('starts with an empty data stream', async () => {
    expect(await firstValueFrom(service.connect())).toEqual([]);
  });

  it('round-trips the filter signal', () => {
    expect(service.getFilterSignal()).toBe('');
    service.setFilterSignal('search');
    expect(service.getFilterSignal()).toBe('search');
  });

  it('round-trips the deleted signal', () => {
    expect(service.getDeletedSignal()).toBe(false);
    service.setDeletedSignal(true);
    expect(service.getDeletedSignal()).toBe(true);
  });

  it('round-trips the download signal', () => {
    expect(service.getDownloadSignal()).toBe(false);
    service.setDownloadSignal(true);
    expect(service.getDownloadSignal()).toBe(true);
  });

  it('disconnect completes the underlying stream', () => {
    let completed = false;
    service.connect().subscribe({ complete: () => (completed = true) });
    service.disconnect();
    expect(completed).toBe(true);
  });
});
