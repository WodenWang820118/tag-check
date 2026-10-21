import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { REPORT_LIST_ITEM_SAMPLE } from '@utils';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ReportTableComponent } from './report-table.component';

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
});
