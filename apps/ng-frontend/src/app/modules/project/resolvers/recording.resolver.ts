import { ProjectRecording } from '@utils';
import { RecordingService } from '../../../shared/services/api/recording/recording.service';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

export const recordingsResolver: ResolveFn<ProjectRecording | null> = (
  route,
  state
) => {
  const recordingService = inject(RecordingService);
  const projectSlug = route.params['projectSlug'];
  return recordingService.getProjectRecordings(projectSlug);
};
