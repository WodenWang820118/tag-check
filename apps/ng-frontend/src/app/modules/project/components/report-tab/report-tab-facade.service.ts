import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs';
import { IReportDetails } from '@utils';
import { FileReportService } from '../../../../shared/services/api/file-report/file-report.service';
import { VideosService } from '../../../../shared/services/api/videos/videos.service';

@Injectable()
export class ReportTabFacade {
  private readonly snackBar = inject(MatSnackBar);
  private readonly fileReportService = inject(FileReportService);
  private readonly videosService = inject(VideosService);

  /** Returns true when a recording video blob is present and non-empty. */
  getRecordingAvailable(videoBlob: Blob | undefined): boolean {
    return !!(videoBlob && videoBlob.size > 0);
  }

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

  /** Downloads the spreadsheet for the given report, either by direct URL or via the file-report service. */
  shareSpreadsheet(
    projectSlug: string | undefined,
    details: IReportDetails | undefined
  ) {
    if (!details) {
      this.openSnackBar('Spreadsheet not available for this run', 1800);
      return;
    }

    const url = this.getSpreadsheetUrl(details);
    if (url) {
      fetch(url, { credentials: 'include' })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch spreadsheet: ${response.status}`);
          }

          return response.blob();
        })
        .then((blob) => {
          this.saveBlob(blob, this.getDownloadFileName(url, 'report.xlsx'));
          this.openSnackBar('Spreadsheet downloaded', 1400);
        })
        .catch(() =>
          this.openSnackBar('Unable to download spreadsheet from URL')
        );
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

    this.fileReportService
      .downloadFileReports(projectSlug, [eventId])
      .pipe(take(1))
      .subscribe((response) => {
        if (response) {
          this.openSnackBar('Spreadsheet downloaded', 1400);
        } else {
          this.openSnackBar('Unable to download spreadsheet', 1800);
        }
      });
  }

  exportRecording(
    projectSlug: string | undefined,
    details: IReportDetails | undefined,
    existingBlob: Blob | undefined
  ) {
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

    this.videosService
      .getVideo(projectSlug, eventId)
      .pipe(take(1))
      .subscribe({
        next: ({ blob }) => {
          if (!blob || blob.size === 0) {
            this.openSnackBar('No recording available');
            return;
          }

          this.saveBlob(blob, `${fileBase}.webm`);
          this.openSnackBar('Recording downloaded', 1400);
        },
        error: () => {
          this.openSnackBar('Unable to download recording');
        }
      });
  }

  exportEvent(
    projectSlug: string | undefined,
    details: IReportDetails | undefined,
    existingBlob: Blob | undefined
  ) {
    this.openSnackBar('Starting event export (XLSX + WEBM)', 1200);
    this.shareSpreadsheet(projectSlug, details);
    this.exportRecording(projectSlug, details, existingBlob);
  }

  private getSpreadsheetUrl(
    details: IReportDetails | undefined
  ): string | undefined {
    if (!details) {
      return undefined;
    }

    type WithXlsx = Partial<
      Record<'xlsxUrl' | 'excelUrl' | 'reportXlsxUrl', string>
    >;

    const detailWithUrl = details as unknown as WithXlsx;
    return (
      detailWithUrl.xlsxUrl ||
      detailWithUrl.excelUrl ||
      detailWithUrl.reportXlsxUrl
    );
  }

  private getDownloadFileName(url: string, fallback: string): string {
    try {
      const parsed = new URL(url);
      const fileName = parsed.pathname.split('/').pop();
      return fileName?.includes('.') ? fileName : fallback;
    } catch {
      return fallback;
    }
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
