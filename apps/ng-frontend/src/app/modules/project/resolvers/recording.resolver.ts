import { Recording } from '@utils';
import { RecordingService } from '../../../shared/services/api/recording/recording.service';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

export const recordingResolver: ResolveFn<Recording[] | null> = (route) => {
  const recordingService = inject(RecordingService);
  const projectSlug = route.params['projectSlug'];
  return recordingService.getProjectRecordings(projectSlug);
};

export const recordingDetailResolver: ResolveFn<Recording | null> = (route) => {
  const recordingService = inject(RecordingService);
  const projectSlug = route.parent?.params['projectSlug'];
  const eventId = route.params['eventId'];
  return recordingService.getRecordingDetails(projectSlug, eventId);
};
