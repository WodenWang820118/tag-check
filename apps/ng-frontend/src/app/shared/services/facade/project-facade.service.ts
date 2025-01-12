import { Injectable } from '@angular/core';
import { Recording } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class ProjectFacadeService {
  private hasRecordingMap: Map<string, boolean> = new Map();

  initializeRecordingStatus(
    reportNames: string[],
    recordings: Record<string, Recording>
  ) {
    this.hasRecordingMap.clear();
    const reportSet = new Set(reportNames);
    for (const [key, value] of Object.entries(recordings)) {
      if (!reportSet.has(key)) continue;
      this.hasRecordingMap.set(key, value.steps.length > 0);
    }
  }

  hasRecording(eventId: string): boolean {
    return this.hasRecordingMap.get(eventId) || false;
  }
}
