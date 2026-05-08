import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { ReportService } from '../shared/services/api/report/report.service';
import { ProjectSlugResolver, ReportResolver } from './report.resolver';

describe('report.resolver', () => {
  const reportService = { getProjectReports: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    reportService.getProjectReports = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ReportService, useValue: reportService }]
    });
  });

  it('ReportResolver fetches reports by route slug', () => {
    const obs = of([] as any);
    reportService.getProjectReports.mockReturnValue(obs);

    const route = { params: { projectSlug: 'foo' } } as any;
    const result = TestBed.runInInjectionContext(() =>
      ReportResolver(route, {} as RouterStateSnapshot)
    );

    expect(result).toBe(obs);
    expect(reportService.getProjectReports).toHaveBeenCalledWith('foo');
  });

  it('ProjectSlugResolver returns the route project slug', () => {
    const route = { params: { projectSlug: 'bar' } } as any;
    const result = TestBed.runInInjectionContext(() =>
      ProjectSlugResolver(route, {} as RouterStateSnapshot)
    );
    expect(result).toBe('bar');
  });
});
