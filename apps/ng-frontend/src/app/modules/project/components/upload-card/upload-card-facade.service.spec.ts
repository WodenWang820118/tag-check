import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GtmJsonParserService } from '../../../../shared/services/api/gtm-json-parser/gtm-json-parser.service';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportMapperService } from '../../services/report-mapper/report-mapper.service';
import { UploadCardFacadeService } from './upload-card-facade.service';

const container = {
  exportFormatVersion: 2,
  exportTime: 'now',
  containerVersion: { tag: [], trigger: [], variable: [], builtInVariable: [] }
};
const summary = {
  saved: true,
  created: ['GA4 - page_view'],
  updated: [],
  unchanged: [],
  skipped: []
};

describe('UploadCardFacadeService', () => {
  const gtmJsonParserService = {
    parseGtmJson: vi.fn(),
    uploadGtmJson: vi.fn()
  };
  const reportService = { getProjectReports: vi.fn() };
  const dataSource = { data: [] as unknown[] };
  let service: UploadCardFacadeService;

  beforeEach(() => {
    vi.resetAllMocks();
    dataSource.data = [];
    gtmJsonParserService.parseGtmJson.mockReturnValue(container);
    gtmJsonParserService.uploadGtmJson.mockReturnValue(of(summary));
    reportService.getProjectReports.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        UploadCardFacadeService,
        { provide: GtmJsonParserService, useValue: gtmJsonParserService },
        { provide: ReportService, useValue: reportService },
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

    expect(gtmJsonParserService.uploadGtmJson).toHaveBeenCalledWith(
      'shop',
      container
    );
    expect(dataSource.data).toEqual([{ eventName: 'a' }, { eventName: 'b' }]);
    expect(service.state()).toEqual({ status: 'done', summary });
  });

  it('shows the parse error and uploads nothing for an invalid file', async () => {
    gtmJsonParserService.parseGtmJson.mockImplementation(() => {
      throw new Error('The file is not valid JSON.');
    });

    selectFile('{oops');
    await settled();

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
