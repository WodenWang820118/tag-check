import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { IReportDetails, TestEventSchema, TestImage } from '@utils';
import { FileReportService } from '../../../shared/services/api/file-report/file-report.service';

export const getFileReportResolver: ResolveFn<TestEventSchema[] | null> = (
  route
) => {
  const fileReportService = inject(FileReportService);

  if (!route.parent) {
    return null;
  }

  return fileReportService.getFileReports(route.parent.params['projectSlug']);
};

export const getProjectSlugResolver: ResolveFn<string | null> = (
  route,
  state
) => {
  if (!route.parent) {
    return null;
  }

  return route.parent.params['projectSlug'];
};
