import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GtmImportConflict, GtmImportSummary } from '@utils';
import { GtmJsonParserService } from '../../../../shared/services/api/gtm-json-parser/gtm-json-parser.service';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportMapperService } from '../../services/report-mapper/report-mapper.service';
import { ImportConflictsDialogComponent } from './import-conflicts-dialog.component';
import { UploadCardFacadeService } from './upload-card-facade.service';

const container = {
  exportFormatVersion: 2,
  exportTime: 'now',
  containerVersion: { tag: [], trigger: [], variable: [], builtInVariable: [] }
};
const summary = JSON.parse(
  JSON.stringify({
    saved: true,
    created: ['GA4 - page_view'],
    updated: [],
    unchanged: [],
    renamed: [],
    keptBoth: [],
    skipped: []
  })
) as GtmImportSummary;
const noConflicts = JSON.parse(JSON.stringify({ conflicts: [] })) as {
  conflicts: GtmImportConflict[];
};

describe('UploadCardFacadeService', () => {
  const gtmJsonParserService = {
    parseGtmJson: vi.fn(),
    previewGtmJson: vi.fn(),
    uploadGtmJson: vi.fn()
  };
  const reportService = { getProjectReports: vi.fn() };
  const dialog = { open: vi.fn() };
  const dataSource = { data: [] as unknown[] };
  let service: UploadCardFacadeService;

  beforeEach(() => {
    vi.resetAllMocks();
    dataSource.data = [];
    gtmJsonParserService.parseGtmJson.mockReturnValue(container);
    gtmJsonParserService.previewGtmJson.mockReturnValue(of(noConflicts));
    gtmJsonParserService.uploadGtmJson.mockReturnValue(of(summary));
    reportService.getProjectReports.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        UploadCardFacadeService,
        { provide: GtmJsonParserService, useValue: gtmJsonParserService },
        { provide: ReportService, useValue: reportService },
        { provide: MatDialog, useValue: dialog },
        {
          provide: ReportTableDataSourceModelService,
          useValue: { dataSource: () => dataSource }
        },
        {
          provide: ReportMapperService,
          useValue: {
            toReportDetails: () => [{ eventName: 'b' }, { eventName: 'a' }]
          }
        }
      ]
    });
    service = TestBed.inject(UploadCardFacadeService);
  });

  function selectFile(text = JSON.stringify(container)) {
    const input = {
      files: [new File([text], 'container.json')],
      value: 'C:\\fakepath\\container.json'
    };
    service.onFileSelected('shop', { target: input } as unknown as Event);
    return input;
  }

  async function settled() {
    await vi.waitFor(() =>
      expect(service.state().status).not.toBe('uploading')
    );
  }

  it('imports the container, reloads the sorted reports and shows the summary', async () => {
    const input = selectFile();
    expect(input.value).toBe('');
    expect(service.state()).toEqual({
      status: 'uploading',
      fileName: 'container.json'
    });

    await settled();

    expect(gtmJsonParserService.previewGtmJson).toHaveBeenCalledWith(
      'shop',
      container
    );
    expect(dialog.open).not.toHaveBeenCalled();
    expect(gtmJsonParserService.uploadGtmJson).toHaveBeenCalledWith(
      'shop',
      container
    );
    expect(dataSource.data).toEqual([{ eventName: 'a' }, { eventName: 'b' }]);
    expect(service.state()).toEqual({ status: 'done', summary });
  });

  it('passes the dialog choices as resolutions', async () => {
    const preview = JSON.parse(
      JSON.stringify({
        conflicts: [
          {
            tagName: 'GA4 - purchase',
            existingEventName: 'purchase',
            newEventName: 'begin_checkout',
            specEdited: true
          }
        ]
      })
    ) as { conflicts: GtmImportConflict[] };
    const resolutions = { 'GA4 - purchase': 'keepBoth' as const };
    gtmJsonParserService.previewGtmJson.mockReturnValue(of(preview));
    dialog.open.mockReturnValue({ afterClosed: () => of(resolutions) });

    selectFile();
    await settled();

    expect(dialog.open).toHaveBeenCalledWith(
      ImportConflictsDialogComponent,
      expect.objectContaining({ data: { conflicts: preview.conflicts } })
    );
    expect(gtmJsonParserService.uploadGtmJson).toHaveBeenCalledWith(
      'shop',
      container,
      resolutions
    );
    expect(service.state()).toEqual({ status: 'done', summary });
  });

  it('uploads nothing and returns to idle when the dialog is cancelled', async () => {
    const preview = JSON.parse(
      JSON.stringify({
        conflicts: [
          {
            tagName: 'GA4 - purchase',
            existingEventName: 'purchase',
            newEventName: 'begin_checkout',
            specEdited: false
          }
        ]
      })
    ) as { conflicts: GtmImportConflict[] };
    gtmJsonParserService.previewGtmJson.mockReturnValue(of(preview));
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

    selectFile();
    await settled();

    expect(gtmJsonParserService.uploadGtmJson).not.toHaveBeenCalled();
    expect(reportService.getProjectReports).not.toHaveBeenCalled();
    expect(service.state()).toEqual({ status: 'idle' });
  });

  it('shows the parse error and uploads nothing for an invalid file', async () => {
    gtmJsonParserService.parseGtmJson.mockImplementation(() => {
      throw new Error('The file is not valid JSON.');
    });

    selectFile('{oops');
    await settled();

    expect(gtmJsonParserService.previewGtmJson).not.toHaveBeenCalled();
    expect(gtmJsonParserService.uploadGtmJson).not.toHaveBeenCalled();
    expect(service.state()).toEqual({
      status: 'error',
      message: 'The file is not valid JSON.'
    });
  });

  it('shows the reason the backend rejected the upload', async () => {
    gtmJsonParserService.uploadGtmJson.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'containerVersion is missing.' }
          })
      )
    );

    selectFile();
    await settled();

    expect(service.state()).toEqual({
      status: 'error',
      message: 'containerVersion is missing.'
    });
  });
});
