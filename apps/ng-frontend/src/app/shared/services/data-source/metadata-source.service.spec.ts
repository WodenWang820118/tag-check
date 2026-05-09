import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MetadataSourceService } from './metadata-source.service';

describe('MetadataSourceService', () => {
  let svc: MetadataSourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(MetadataSourceService);
  });

  it('starts with an empty project list', async () => {
    expect(await firstValueFrom(svc.getData())).toEqual([]);
  });

  it('emits projects pushed via setData', async () => {
    const projects = [{ projectName: 'a', projectSlug: 'a' }] as any;
    svc.setData(projects);
    expect(await firstValueFrom(svc.getData())).toBe(projects);
  });

  it('exposes the current filter signal value', () => {
    expect(svc.getFilterSignal()).toBe('');
    svc.setFilterSignal('search');
    expect(svc.getFilterSignal()).toBe('search');
  });

  it('connect() returns the same stream as getData()', async () => {
    const projects = [{ projectName: 'b', projectSlug: 'b' }] as any;
    svc.setData(projects);
    expect(await firstValueFrom(svc.connect())).toBe(projects);
  });

  it('disconnect() resets the filter signal', () => {
    svc.setFilterSignal('x');
    svc.disconnect();
    expect(svc.getFilterSignal()).toBe('');
  });
});
