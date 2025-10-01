import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';
import { FileReportService } from '../../../../shared/services/api/file-report/file-report.service';
import { VideosService } from '../../../../shared/services/api/videos/videos.service';
import { IReportDetails } from '@utils';

@Injectable()
export class ReportTabFacade {
  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly fileReportService: FileReportService,
    private readonly videosService: VideosService,
    private readonly route: ActivatedRoute
  ) {}

  // State helpers
  getRecordingAvailable(videoBlob: Blob | undefined): boolean {
    return !!(videoBlob && videoBlob.size > 0);
  }

  getProjectSlugFromRoute(): string | undefined {
    let r: ActivatedRoute | null = this.route;
    while (r) {
      const slug = r.snapshot.params['projectSlug'];
      if (slug) return slug;
      r = r.parent;
    }
    return undefined;
  }

  // Actions
  copyEventName(details: IReportDetails | undefined) {
    const value = details?.eventName;
    if (!value) return;
    const write = navigator.clipboard?.writeText?.bind(navigator.clipboard);
    if (write) {
      write(value)
        .then(() => {
          this.snackBar.open('Event name copied', undefined, {
            duration: 1500,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        })
        .catch(() => {
          this.snackBar.open('Unable to copy', undefined, {
            duration: 1500,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        });
    } else {
      this.snackBar.open('Unable to copy', undefined, {
        duration: 1500,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }

  shareSpreadsheet(details: IReportDetails | undefined) {
    if (!details) {
      this.snackBar.open('Spreadsheet not available for this run', undefined, {
        duration: 1800,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    const url = this.getSpreadsheetUrl(details);
    if (url) {
      fetch(url, { credentials: 'include' })
        .then((res) => {
          if (!res.ok)
            throw new Error(`Failed to fetch spreadsheet: ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          const filename = (() => {
            try {
              const parsed = new URL(url);
              const path = parsed.pathname || '';
              const name = path.split('/').pop();
              return name?.includes('.') ? name : 'report.xlsx';
            } catch {
              return 'report.xlsx';
            }
          })();

          const link = document.createElement('a');
          link.href = globalThis.URL.createObjectURL(blob);
          link.download = filename;
          link.click();
          globalThis.URL.revokeObjectURL(link.href);
          this.snackBar.open('Spreadsheet downloaded', undefined, {
            duration: 1400,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        })
        .catch(() => {
          this.snackBar.open(
            'Unable to download spreadsheet from URL',
            undefined,
            {
              duration: 1500,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            }
          );
        });
      return;
    }

    const projectSlug = this.getProjectSlugFromRoute();
    const eventId = details.eventId;
    if (!projectSlug || !eventId) {
      this.snackBar.open(
        'Unable to download spreadsheet (missing project or event)',
        undefined,
        {
          duration: 2000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        }
      );
      return;
    }

    this.fileReportService
      .downloadFileReports(projectSlug, [eventId])
      .pipe(take(1))
      .subscribe((r) => {
        if (r) {
          this.snackBar.open('Spreadsheet downloaded', undefined, {
            duration: 1400,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        } else {
          this.snackBar.open('Unable to download spreadsheet', undefined, {
            duration: 1800,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        }
      });
  }

  exportRecording(
    details: IReportDetails | undefined,
    existingBlob: Blob | undefined
  ) {
    const projectSlug = this.getProjectSlugFromRoute();
    const eventId = details?.eventId;
    const fileBase = this.buildFileBase(
      projectSlug,
      details?.eventName ?? eventId ?? 'recording'
    );

    if (existingBlob && existingBlob.size > 0) {
      this.saveBlob(existingBlob, `${fileBase}.webm`);
      this.snackBar.open('Recording downloaded', undefined, {
        duration: 1400,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    if (!projectSlug || !eventId) {
      this.snackBar.open(
        'Unable to download recording (missing project or event)',
        undefined,
        {
          duration: 1800,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        }
      );
      return;
    }

    this.videosService
      .getVideo(projectSlug, eventId)
      .pipe(take(1))
      .subscribe({
        next: ({ blob }) => {
          if (!blob || blob.size === 0) {
            this.snackBar.open('No recording available', undefined, {
              duration: 1500,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            });
            return;
          }
          this.saveBlob(blob, `${fileBase}.webm`);
          this.snackBar.open('Recording downloaded', undefined, {
            duration: 1400,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        },
        error: () => {
          this.snackBar.open('Unable to download recording', undefined, {
            duration: 1500,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        }
      });
  }

  exportEvent(
    details: IReportDetails | undefined,
    existingBlob: Blob | undefined
  ) {
    this.snackBar.open('Starting event export (XLSX + WEBM)…', undefined, {
      duration: 1200,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
    this.shareSpreadsheet(details);
    this.exportRecording(details, existingBlob);
  }

  // Private helpers
  private getSpreadsheetUrl(
    details: IReportDetails | undefined
  ): string | undefined {
    if (!details) return undefined;
    type WithXlsx = Partial<
      Record<'xlsxUrl' | 'excelUrl' | 'reportXlsxUrl', string>
    >;
    const d = details as unknown as WithXlsx;
    return d.xlsxUrl || d.excelUrl || d.reportXlsxUrl;
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
    if (safeSlug) return `${safeSlug}_${safeEvent || 'event'}`;
    return safeEvent || 'event';
  }
}
