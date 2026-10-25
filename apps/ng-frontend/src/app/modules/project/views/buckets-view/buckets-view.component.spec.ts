import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Jsonified, RunSummary, RUN_SUMMARY_SAMPLE } from '@utils';
import { BucketsViewComponent } from './buckets-view.component';

/** GET /file-reports/:projectSlug: one row per run, newest first. */
const runs: Jsonified<RunSummary>[] = JSON.parse(
  JSON.stringify([
    {
      ...RUN_SUMMARY_SAMPLE,
      runId: 3,
      eventId: 'view-item-list',
      eventName: 'view_item_list',
      testName: 'GA4 event - view_item_list'
    },
    {
      ...RUN_SUMMARY_SAMPLE,
      runId: 2,
      eventId: 'view-item',
      eventName: 'view_item',
      testName: 'GA4 event - view_item'
    },
    {
      ...RUN_SUMMARY_SAMPLE,
      runId: 1,
      eventId: 'view-item',
      eventName: 'view_item',
      testName: 'GA4 event - view_item',
      passed: false
    },
    RUN_SUMMARY_SAMPLE
  ])
);

describe('BucketsViewComponent', () => {
  async function openReports(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          {
            path: 'projects/:projectSlug',
            children: [
              {
                path: 'buckets',
                component: BucketsViewComponent,
                resolve: { fileReports: () => runs, projectSlug: () => 'shop' }
              }
            ]
          }
        ])
      ]
    });
    const harness = await RouterTestingHarness.create(url);
    harness.fixture.detectChanges();
    return harness;
  }

  function shownEvents(element: HTMLElement) {
    return Array.from(element.querySelectorAll('tr.element-row'), (row) =>
      row.querySelector('td.mat-column-eventName')?.textContent?.trim()
    );
  }

  it("lists only the runs of the event History opened it with, until the filter's chip is removed", async () => {
    const harness = await openReports('/projects/shop/buckets?event=view_item');
    const element: HTMLElement = harness.routeNativeElement ?? document.body;

    expect(shownEvents(element)).toEqual(['view_item', 'view_item']);
    expect(
      element
        .querySelector('[data-testid="reports-event-filter"]')
        ?.textContent?.trim()
    ).toContain('Runs of view_item');

    element
      .querySelector<HTMLElement>('[data-testid="reports-event-filter-clear"]')
      ?.click();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/projects/shop/buckets');
    expect(shownEvents(element)).toEqual([
      'view_item_list',
      'view_item',
      'view_item',
      'add_to_cart'
    ]);
    expect(
      element.querySelector('[data-testid="reports-event-filter"]')
    ).toBeNull();
  });

  it('lists every run without ?event=', async () => {
    const harness = await openReports('/projects/shop/buckets');
    const element: HTMLElement = harness.routeNativeElement ?? document.body;

    expect(shownEvents(element)).toHaveLength(4);
    expect(
      element.querySelector('[data-testid="reports-event-filter"]')
    ).toBeNull();
  });
});
