import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { FileReportService } from '../../../shared/services/api/file-report/file-report.service';
import {
  getFileReportResolver,
  getProjectSlugResolver
} from './file-report.resolver';

describe('file-report.resolver', () => {
  const fileReportService = { getFileReports: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    fileReportService.getFileReports = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: FileReportService, useValue: fileReportService }]
    });
  });

  function runFileReport(route: Partial<ActivatedRouteSnapshot>) {
    return TestBed.runInInjectionContext(() =>
      getFileReportResolver(
        route as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );
  }

  function runSlug(route: Partial<ActivatedRouteSnapshot>) {
    return TestBed.runInInjectionContext(() =>
      getProjectSlugResolver(
        route as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );
  }

  it('returns null when no parent route exists', () => {
    expect(runFileReport({ parent: null })).toBeNull();
    expect(fileReportService.getFileReports).not.toHaveBeenCalled();
  });

  it('fetches file reports using the parent project slug', () => {
    const obs = of([] as any);
    fileReportService.getFileReports.mockReturnValue(obs);

    const result = runFileReport({
      parent: { params: { projectSlug: 'shop' } } as any
    });

    expect(result).toBe(obs);
    expect(fileReportService.getFileReports).toHaveBeenCalledWith('shop');
  });

  it('getProjectSlugResolver returns null without parent', () => {
    expect(runSlug({ parent: null })).toBeNull();
  });

  it('getProjectSlugResolver returns parent project slug', () => {
    expect(runSlug({ parent: { params: { projectSlug: 'biz' } } as any })).toBe(
      'biz'
    );
  });
});
