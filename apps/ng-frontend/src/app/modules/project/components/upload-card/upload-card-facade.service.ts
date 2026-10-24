import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractTestEvent, GtmImportSummary } from '@utils';
import { from, map, switchMap, take } from 'rxjs';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { GtmJsonParserService } from '../../../../shared/services/api/gtm-json-parser/gtm-json-parser.service';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportMapperService } from '../../services/report-mapper/report-mapper.service';

export type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string }
  | { status: 'done'; summary: GtmImportSummary }
  | { status: 'error'; message: string };

/**
 * The "Import GTM JSON" tab: uploads a container export, which creates
 * or updates the project's tests, then reloads the tests table.
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
          this.gtmJsonParserService.uploadGtmJson(projectSlug, container)
        ),
        switchMap((summary) =>
          this.reportService.getProjectReports(projectSlug).pipe(
            map((reports) => {
              this.showReports(reports);
              return summary;
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
