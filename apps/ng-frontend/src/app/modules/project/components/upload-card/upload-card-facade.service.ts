import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import {
  AbstractTestEvent,
  GTMConfiguration,
  GtmImportConflict,
  GtmImportSummary
} from '@utils';
import { from, map, Observable, of, switchMap, take } from 'rxjs';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { GtmJsonParserService } from '../../../../shared/services/api/gtm-json-parser/gtm-json-parser.service';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportMapperService } from '../../services/report-mapper/report-mapper.service';
import {
  ImportConflictsDialogComponent,
  ImportConflictsDialogData,
  ImportConflictsDialogResult
} from './import-conflicts-dialog.component';

export type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string }
  | { status: 'done'; summary: GtmImportSummary }
  | { status: 'error'; message: string };

/**
 * Imports a Tag Manager container into a project. The "Import GTM JSON" tab
 * uploads a file, and Tag Build's "Import into this project" passes the
 * container it just built. Both call {@link importContainerIntoProject},
 * which previews, asks about event-name conflicts, uploads and reloads the
 * tests table. Cancelling the conflict dialog uploads nothing.
 */
@Injectable({
  providedIn: 'root'
})
export class UploadCardFacadeService {
  private readonly reportService = inject(ReportService);
  private readonly gtmJsonParserService = inject(GtmJsonParserService);
  private readonly reportTableDataSourceModelService = inject(
    ReportTableDataSourceModelService
  );
  private readonly reportMapper = inject(ReportMapperService);
  private readonly dialog = inject(MatDialog);

  readonly state = signal<UploadState>({ status: 'idle' });

  /** Imports the chosen Tag Manager container export into the project, then reloads the report table. */
  onFileSelected(projectSlug: string, event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (input) {
      // Lets the user pick the same file again after fixing it.
      input.value = '';
    }
    if (!file || !projectSlug) {
      return;
    }

    this.state.set({ status: 'uploading', fileName: file.name });
    from(file.text())
      .pipe(
        map((text) => this.gtmJsonParserService.parseGtmJson(text)),
        switchMap((container) =>
          this.importContainerIntoProject(projectSlug, container)
        ),
        take(1)
      )
      .subscribe({
        next: (summary) => {
          if (!summary) {
            this.state.set({ status: 'idle' });
            return;
          }
          this.state.set({ status: 'done', summary });
        },
        error: (error: unknown) =>
          this.state.set({
            status: 'error',
            message: gtmImportErrorMessage(error)
          })
      });
  }

  /**
   * Imports a container the caller already parsed. Previews it, opens the
   * conflict dialog only when that preview lists conflicts, and uploads
   * with the chosen resolutions. Emits null when the dialog is cancelled,
   * and reloads the tests table after a successful upload.
   */
  importContainerIntoProject(
    projectSlug: string,
    container: GTMConfiguration
  ): Observable<GtmImportSummary | null> {
    return this.gtmJsonParserService
      .previewGtmJson(projectSlug, container)
      .pipe(
        switchMap((preview) => {
          if (preview.conflicts.length === 0) {
            return this.uploadContainer(projectSlug, container);
          }
          return this.askResolutions(preview.conflicts).pipe(
            switchMap((resolutions) => {
              if (!resolutions) {
                return of(null);
              }
              return this.uploadContainer(projectSlug, container, resolutions);
            })
          );
        })
      );
  }

  private askResolutions(
    conflicts: GtmImportConflict[]
  ): Observable<ImportConflictsDialogResult | undefined> {
    return this.dialog
      .open<
        ImportConflictsDialogComponent,
        ImportConflictsDialogData,
        ImportConflictsDialogResult
      >(ImportConflictsDialogComponent, {
        data: { conflicts },
        width: '560px',
        maxWidth: '92vw'
      })
      .afterClosed();
  }

  private uploadContainer(
    projectSlug: string,
    container: GTMConfiguration,
    resolutions?: ImportConflictsDialogResult
  ) {
    const upload =
      resolutions === undefined
        ? this.gtmJsonParserService.uploadGtmJson(projectSlug, container)
        : this.gtmJsonParserService.uploadGtmJson(
            projectSlug,
            container,
            resolutions
          );
    return upload.pipe(
      switchMap((summary) =>
        this.reportService.getProjectReports(projectSlug).pipe(
          map((reports) => {
            this.showReports(reports);
            return summary;
          })
        )
      )
    );
  }

  private showReports(reports: AbstractTestEvent[]) {
    const sorted = this.reportMapper
      .toReportDetails(reports)
      .sort((a, b) => a.eventName.localeCompare(b.eventName));
    this.reportTableDataSourceModelService.dataSource().data = sorted;
  }
}

/** The reason to show when a container import fails. */
export function gtmImportErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const message: unknown = error.error?.message;
    if (typeof message === 'string' && message) {
      return message;
    }
    return `The import failed (HTTP ${error.status}).`;
  }
  return error instanceof Error ? error.message : String(error);
}
