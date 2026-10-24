import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { firstValueFrom, of, Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import {
  ProjectSetting,
  REPORT_DETAIL_SAMPLE,
  REPORT_LIST_ITEM_SAMPLE,
  ReportDetailResponse
} from '@utils';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { GtmOperatorService } from '../../../../shared/services/api/gtm-operator/gtm-operator.service';
import { SettingsService } from '../../../../shared/services/api/settings/settings.service';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportTableFacadeService } from './report-table-facade.service';

/** Project settings as GET /settings/:projectSlug returns them. */
const SETTINGS = JSON.parse(
  JSON.stringify({
    projectSlug: 'shop',
    measurementId: 'G-8HKQR5ZBSK',
    browserSettings: { headless: false, browser: [] },
    authenticationSettings: { username: '', password: '' },
    applicationSettings: {
      websiteUrl: 'https://ng-gtm-sample.vercel.app/home',
      localStorage: { data: [] },
      cookie: { data: [] },
      gtm: {
        isAccompanyMode: true,
        isRequestCheck: true,
        gtmPreviewModeUrl: 'https://tagassistant.google.com/#/?id=GTM-NBMX2DWS'
      }
    }
  })
) as ProjectSetting;

/** The tests list and a run's result as the API returns them. */
const LIST = JSON.parse(
  JSON.stringify([
    { ...REPORT_LIST_ITEM_SAMPLE, passed: false, requestPassed: false }
  ])
);
const RUN_RESULT = JSON.parse(
  JSON.stringify([REPORT_DETAIL_SAMPLE])
) as ReportDetailResponse[];

describe('ReportTableFacadeService.runTest', () => {
  it('writes the result into the table shown when the run ends', async () => {
    const run = new Subject<ReportDetailResponse[]>();
    TestBed.configureTestingModule({
      providers: [
        // MatPaginator asks for the change detector of its view.
        { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
        { provide: ReportService, useValue: {} },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        {
          provide: SettingsService,
          useValue: { getProjectSettings: () => of(SETTINGS) }
        },
        {
          provide: GtmOperatorService,
          useValue: { runInspectionViaGtm: () => run }
        }
      ]
    });
    const facade = TestBed.inject(ReportTableFacadeService);
    const model = TestBed.inject(ReportTableDataSourceModelService);
    const data = { projectSlug: 'shop', projectReport: LIST };
    const paginator = (): MatPaginator =>
      TestBed.runInInjectionContext(() => new MatPaginator());
    const sort = (): MatSort =>
      TestBed.runInInjectionContext(() => new MatSort());
    facade.initializeData(paginator(), sort(), data);

    const result = firstValueFrom(
      facade.runTest(REPORT_LIST_ITEM_SAMPLE.eventId)
    );
    // The user leaves the tests page and comes back while the test runs.
    const returnPaginator = paginator();
    const returnSort = sort();
    facade.initializeData(returnPaginator, returnSort, data);
    run.next(RUN_RESULT);
    run.complete();
    await result;

    const table = model.dataSource();
    expect(table.paginator).toBe(returnPaginator);
    expect(table.sort).toBe(returnSort);
    expect(table.data).toEqual([
      expect.objectContaining({
        eventId: REPORT_LIST_ITEM_SAMPLE.eventId,
        passed: true,
        requestPassed: true
      })
    ]);
  });
});
