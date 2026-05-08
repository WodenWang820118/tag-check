import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ProjectDataSourceService } from './project-data-source.service';

describe('ProjectDataSourceService', () => {
  let svc: ProjectDataSourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ProjectDataSourceService);
  });

  it('emits an empty list initially via connect()', async () => {
    expect(await firstValueFrom(svc.connect())).toEqual([]);
  });

  it('setData pushes a new value to the stream', async () => {
    const reports = [{ eventName: 'e1' }] as any;
    svc.setData(reports);
    expect(await firstValueFrom(svc.connect())).toBe(reports);
  });

  it('filter signal round-trips through setFilterSignal/getFilterSignal', () => {
    expect(svc.getFilterSignal()).toBe('');
    svc.setFilterSignal('search');
    expect(svc.getFilterSignal()).toBe('search');
  });

  it('preventNavigation signal round-trips', () => {
    expect(svc.getPreventNavigationSignal()).toBe(false);
    svc.setPreventNavigationSignal(true);
    expect(svc.getPreventNavigationSignal()).toBe(true);
  });

  it('deleted signal round-trips', () => {
    expect(svc.getDeletedSignal()).toBe(false);
    svc.setDeletedSignal(true);
    expect(svc.getDeletedSignal()).toBe(true);
  });
});
