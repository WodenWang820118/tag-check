import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { IReportDetails, TestEventSchema } from '@utils';
import { ImageService } from '../../../shared/services/api/image/image.service';
import { ReportService } from '../../../shared/services/api/report/report.service';
import { VideosService } from '../../../shared/services/api/videos/videos.service';

export const reportDetailResolver: ResolveFn<IReportDetails | null> = (
  route,
  state
) => {
  const reportService = inject(ReportService);
  const projectSlug = route.parent?.params['projectSlug'];
  const eventId = route.params['eventId'];
  return reportService.getReportDetails(projectSlug, eventId);
};

export const videoResolver: ResolveFn<Blob | null> = (route, state) => {
  const videoService = inject(VideosService);
  const projectSlug = route.parent?.params['projectSlug'];
  const eventId = route.params['eventId'];
  return videoService.getVideo(projectSlug, eventId);
};

export const imageResolver: ResolveFn<Blob | null> = (route, state) => {
  const imageService = inject(ImageService);
  const eventId = route.params['eventId'];
  return imageService.getImage(eventId);
};

export const projectReportResolver: ResolveFn<TestEventSchema | null> = (
  route,
  state
) => {
  const reportService = inject(ReportService);
  const projectSlug = route.params['projectSlug'];
  return reportService.getProjectReports(projectSlug);
};

export const reportNamesResolver: ResolveFn<string[] | null> = (
  route,
  state
) => {
  const reportService = inject(ReportService);
  const projectSlug = route.params['projectSlug'];
  return reportService.getProjectReportNames(projectSlug);
};
