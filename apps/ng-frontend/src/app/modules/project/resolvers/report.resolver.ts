import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AbstractTestEvent } from '@utils';
import { ImageService } from '../../../shared/services/api/image/image.service';
import { RecordingService } from '../../../shared/services/api/recording/recording.service';
import { ReportService } from '../../../shared/services/api/report/report.service';
import { SpecService } from '../../../shared/services/api/spec/spec.service';
import { VideosService } from '../../../shared/services/api/videos/videos.service';
import {
  buildReportPage,
  ReportDetailRouteContext
} from '../components/report-detail.contracts';

/** Loads everything the report page shows, as one typed object. */
export const reportPageResolver: ResolveFn<ReportDetailRouteContext> = (
  route
) => {
  const projectSlug: string = route.parent?.params['projectSlug'] ?? '';
  const eventId: string = route.params['eventId'];
  return forkJoin({
    detail: inject(ReportService).getReportDetails(projectSlug, eventId),
    spec: inject(SpecService).getEventSpec(projectSlug, eventId),
    recording: inject(RecordingService).getRecordingDetails(
      projectSlug,
      eventId
    ),
    video: inject(VideosService).getVideo(projectSlug, eventId),
    // Only accompanied-mode runs record Tag Assistant; a missing file is
    // served empty, and a failed request must not block the page.
    tagAssistantVideo: inject(VideosService)
      .getVideo(projectSlug, eventId, 'tag-assistant')
      .pipe(catchError(() => of(null))),
    image: inject(ImageService).getImage(projectSlug, eventId)
  }).pipe(
    map((loaded) => buildReportPage({ projectSlug, eventId, ...loaded }))
  );
};

export const projectReportResolver: ResolveFn<AbstractTestEvent[]> = (
  route
) => {
  const reportService = inject(ReportService);
  const projectSlug = route.params['projectSlug'];
  return reportService.getProjectReports(projectSlug);
};
