import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { TestEventSchema } from '@utils';
import { ReportService } from '../shared/services/api/report/report.service';

export const ReportResolver: ResolveFn<TestEventSchema | null> = (
  route,
  state
) => {
  const reportService = inject(ReportService);
  const projectSlug = route.params['projectSlug'];
  return reportService.getProjectReports(projectSlug);
};

export const ProjectSlugResolver: ResolveFn<string | null> = (route, state) => {
  return route.params['projectSlug'];
};
