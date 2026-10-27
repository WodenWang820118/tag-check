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

/** The run `?run=<runId>` asks for; undefined for the latest run. */
export function readRunId(value: unknown): number | undefined {
  const runId = Number(value);
  return Number.isInteger(runId) && runId > 0 ? runId : undefined;
}

/**
 * Loads everything the report page shows, as one typed object: the test,
 * and the run `?run=<runId>` picks (its latest run by default) with its
 * recordings and screenshot.
 */
export const reportPageResolver: ResolveFn<ReportDetailRouteContext> = (
  route
) => {
  const projectSlug: string = route.parent?.params['projectSlug'] ?? '';
  const eventId: string = route.params['eventId'];
  const runId = readRunId(route.queryParams['run']);
  return forkJoin({
    detail: inject(ReportService).getReportDetails(projectSlug, eventId, runId),
    spec: inject(SpecService).getEventSpec(projectSlug, eventId),
    recording: inject(RecordingService).getRecordingDetails(
      projectSlug,
      eventId
    ),
    video: inject(VideosService).getVideo(
      projectSlug,
      eventId,
      undefined,
      runId
    ),
    // Only accompanied-mode runs record Tag Assistant; a missing file is
    // served empty, and a failed request must not block the page.
    tagAssistantVideo: inject(VideosService)
      .getVideo(projectSlug, eventId, 'tag-assistant', runId)
      .pipe(catchError(() => of(null))),
    image: inject(ImageService).getImage(projectSlug, eventId, runId)
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
