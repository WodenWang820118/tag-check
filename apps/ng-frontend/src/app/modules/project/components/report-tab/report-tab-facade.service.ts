import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { IReportDetails } from '@utils';
import { FileReportService } from '../../../../shared/services/api/file-report/file-report.service';
import { VideosService } from '../../../../shared/services/api/videos/videos.service';

/**
 * Actions of a test's Latest result tab: copy the event name, and export
 * the spreadsheet, the recording or both. Each says how it went in a
 * snackbar.
 */
@Injectable()
export class ReportTabFacade {
  private readonly snackBar = inject(MatSnackBar);
  private readonly fileReportService = inject(FileReportService);
  private readonly videosService = inject(VideosService);

  /** Copies the given event name to the clipboard and shows a snack bar notification. */
  copyEventName(eventName: string | undefined) {
    if (!eventName) {
      return;
    }

    const write = navigator.clipboard?.writeText?.bind(navigator.clipboard);
    if (!write) {
      this.openSnackBar('Unable to copy');
      return;
    }

    write(eventName)
      .then(() => this.openSnackBar('Event name copied'))
      .catch(() => this.openSnackBar('Unable to copy'));
  }

  /** Downloads the spreadsheet of the given test through the file-reports API. */
  async shareSpreadsheet(
    projectSlug: string | undefined,
    details: IReportDetails | undefined,
    runId?: number
  ): Promise<void> {
    if (!details) {
      this.openSnackBar('Spreadsheet not available for this run', 1800);
      return;
    }

    const eventId = details.eventId;
    if (!projectSlug || !eventId) {
      this.openSnackBar(
        'Unable to download spreadsheet (missing project or event)',
        2000
      );
      return;
    }

    try {
      const response = await firstValueFrom(
        this.fileReportService.downloadFileReports(
          projectSlug,
          [eventId],
          runId
        )
      );
      if (response) {
        this.openSnackBar('Spreadsheet downloaded', 1400);
      } else {
        this.openSnackBar('Unable to download spreadsheet', 1800);
      }
    } catch {
      this.openSnackBar('Unable to download spreadsheet', 1800);
    }
  }

  async exportRecording(
    projectSlug: string | undefined,
    details: IReportDetails | undefined,
    existingBlob: Blob | undefined,
    runId?: number
  ): Promise<void> {
    const eventId = details?.eventId;
    const fileBase = this.buildFileBase(
      projectSlug,
      details?.eventName ?? eventId ?? 'recording'
    );

    if (existingBlob && existingBlob.size > 0) {
      this.saveBlob(existingBlob, `${fileBase}.webm`);
      this.openSnackBar('Recording downloaded', 1400);
      return;
    }

    if (!projectSlug || !eventId) {
      this.openSnackBar(
        'Unable to download recording (missing project or event)',
        1800
      );
      return;
    }

    try {
      const { blob } = await firstValueFrom(
        this.videosService.getVideo(projectSlug, eventId, undefined, runId)
      );
      if (!blob || blob.size === 0) {
        this.openSnackBar('No recording available');
        return;
      }

      this.saveBlob(blob, `${fileBase}.webm`);
      this.openSnackBar('Recording downloaded', 1400);
    } catch {
      this.openSnackBar('Unable to download recording');
    }
  }

  async exportEvent(
    projectSlug: string | undefined,
    details: IReportDetails | undefined,
    existingBlob: Blob | undefined,
    runId?: number
  ): Promise<void> {
    this.openSnackBar('Starting event export (XLSX + WEBM)', 1200);
    await Promise.all([
      this.shareSpreadsheet(projectSlug, details, runId),
      this.exportRecording(projectSlug, details, existingBlob, runId)
    ]);
  }

  private saveBlob(blob: Blob, fileName: string) {
    const link = document.createElement('a');
    link.href = globalThis.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    globalThis.URL.revokeObjectURL(link.href);
  }

  private buildFileBase(
    projectSlug: string | undefined,
    eventNameOrId: string
  ): string {
    const safeEvent = (eventNameOrId || '')
      .toString()
      .trim()
      .toLowerCase()
      .replaceAll(/[^a-z0-9-_]+/g, '-');
    const safeSlug = (projectSlug || '')
      .toString()
      .trim()
      .toLowerCase()
      .replaceAll(/[^a-z0-9-_]+/g, '-');

    if (safeSlug) {
      return `${safeSlug}_${safeEvent || 'event'}`;
    }

    return safeEvent || 'event';
  }

  private openSnackBar(message: string, duration = 1500) {
    this.snackBar.open(message, undefined, {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
