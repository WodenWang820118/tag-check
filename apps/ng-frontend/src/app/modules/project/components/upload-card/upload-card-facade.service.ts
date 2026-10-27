import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import {
  AbstractTestEvent,
  GTMConfiguration,
  GtmImportConflict,
  GtmImportSummary
} from '@utils';
import { EMPTY, from, map, Observable, switchMap, take } from 'rxjs';
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
 * The "Import GTM JSON" tab: uploads a container export, which creates
 * or updates the project's tests, then reloads the tests table. A tag whose
 * event name changed is shown first; cancelling that dialog uploads nothing.
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
          this.gtmJsonParserService.previewGtmJson(projectSlug, container).pipe(
            switchMap((preview) => {
              if (preview.conflicts.length === 0) {
                return this.importContainer(projectSlug, container);
              }
              return this.askResolutions(preview.conflicts).pipe(
                switchMap((resolutions) => {
                  if (!resolutions) {
                    this.state.set({ status: 'idle' });
                    return EMPTY;
                  }
                  return this.importContainer(
                    projectSlug,
                    container,
                    resolutions
                  );
                })
              );
            })
          )
        ),
        take(1)
      )
      .subscribe({
        next: (summary) => this.state.set({ status: 'done', summary }),
        error: (error: unknown) =>
          this.state.set({ status: 'error', message: toUserMessage(error) })
      });
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

  private importContainer(
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

function toUserMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const message: unknown = error.error?.message;
    if (typeof message === 'string' && message) {
      return message;
    }
    return `The import failed (HTTP ${error.status}).`;
  }
  return error instanceof Error ? error.message : String(error);
}
