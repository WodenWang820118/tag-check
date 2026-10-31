import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import {
  REPORT_DETAIL_SAMPLE,
  REPORT_LIST_ITEM_SAMPLE,
  type ReportDetailResponse
} from '@utils';
import { BehaviorSubject, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportTableComponent, runSnack } from './report-table.component';

/** Items of GET /reports/:projectSlug as they arrive over HTTP. */
const ran = JSON.parse(JSON.stringify(REPORT_LIST_ITEM_SAMPLE));
const emptied = {
  ...ran,
  id: 4,
  eventId: '9b1c2d3e-4f50-4617-8a9b-0c1d2e3f4a5b',
  testName: 'GA4 event - refund',
  eventName: 'refund',
  passed: false,
  requestPassed: false,
  // Every run was deleted after the test had run.
  lastRunAt: null
};

async function renderTable() {
  TestBed.configureTestingModule({
    providers: [
      provideNoopAnimations(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          data: of({ projectSlug: 'shop', projectReport: [ran, emptied] })
        }
      },
      {
        provide: TestRunningFacadeService,
        useValue: { isRunningTest$: () => false, eventRunningTest$: () => '' }
      }
    ]
  });
  const fixture = TestBed.createComponent(ReportTableComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return (eventName: string) => {
    const link = element.querySelector(
      `[data-testid="test-link-${eventName}"]`
    );
    return link?.closest('tr')?.textContent?.replace(/\s+/gu, ' ') ?? '';
  };
}

describe('ReportTableComponent', () => {
  it('shows when each test last ran, and Not run with a dash once its runs are deleted', async () => {
    const rowText = await renderTable();

    expect(rowText('add_to_cart')).toContain('Passed');
    expect(rowText('add_to_cart')).toContain('2026');
    expect(rowText('refund')).toContain('Not run');
    expect(rowText('refund')).toContain('—');
    expect(rowText('refund')).not.toContain('2026');
  });

  it("shows the new project's tests when the toolbar switches project", async () => {
    // Switching project reuses the component; only the route data changes.
    const data = new BehaviorSubject<Record<string, unknown>>({
      projectSlug: 'shop',
      projectReport: [ran]
    });
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data } },
        {
          provide: TestRunningFacadeService,
          useValue: { isRunningTest$: () => false, eventRunningTest$: () => '' }
        }
      ]
    });
    const fixture = TestBed.createComponent(ReportTableComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const model = TestBed.inject(ReportTableDataSourceModelService);
    model.selection().select(...model.dataSource().data);

    data.next({ projectSlug: 'other-shop', projectReport: [emptied] });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="test-link-refund"]')).not.toBe(
      null
    );
    expect(element.querySelector('[data-testid="test-link-add_to_cart"]')).toBe(
      null
    );
    expect(model.selection().hasValue()).toBe(false);
  });
});

describe('runSnack', () => {
  /** POST /datalayer's report, as JSON, with the run's checks set. */
  function report(checks: {
    passed: boolean;
    requestPassed: boolean;
    requestChecked?: boolean;
  }): ReportDetailResponse {
    const sample = JSON.parse(
      JSON.stringify(REPORT_DETAIL_SAMPLE)
    ) as ReportDetailResponse;
    return {
      ...sample,
      testEventDetails: { ...sample.testEventDetails, ...checks }
    } as ReportDetailResponse;
  }

  it('lists both checks of a run that made the request check', () => {
    expect(runSnack(report({ passed: true, requestPassed: false }))).toEqual({
      status: 'partial',
      text: 'Test (add_to_cart) partial. DataLayer: ✓, Request: ✗'
    });
    expect(
      runSnack(report({ passed: true, requestPassed: true })).text
    ).toContain('Request: ✓');
  });

  it('says the request check was not made when Request Check was off', () => {
    expect(
      runSnack(
        report({ passed: true, requestPassed: false, requestChecked: false })
      )
    ).toEqual({
      status: 'passed',
      text: 'Test (add_to_cart) passed. DataLayer: ✓, Request: not checked'
    });
  });
});
