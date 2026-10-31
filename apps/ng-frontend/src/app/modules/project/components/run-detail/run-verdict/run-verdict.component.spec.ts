import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import {
  REPORT_DETAIL_SAMPLE,
  type ReportDetailResponse,
  type RunHistoryEntry,
  type TestEventDetailSchema
} from '@utils';
import {
  HISTORY_RUNS_SHOWN,
  RunVerdictComponent
} from './run-verdict.component';

/** GET /reports/:projectSlug/:eventId as the page receives it (JSON). */
function sample(): ReportDetailResponse {
  return JSON.parse(
    JSON.stringify(REPORT_DETAIL_SAMPLE)
  ) as ReportDetailResponse;
}

function render(
  run: TestEventDetailSchema | null,
  runs: RunHistoryEntry[] = sample().runs
) {
  TestBed.configureTestingModule({
    imports: [RunVerdictComponent],
    providers: [provideRouter([])]
  });
  const fixture = TestBed.createComponent(RunVerdictComponent);
  fixture.componentRef.setInput('run', run);
  fixture.componentRef.setInput('runs', runs);
  fixture.componentRef.setInput('eventName', 'add_to_cart');
  fixture.detectChanges();
  const text = (id: string) =>
    (
      fixture.nativeElement.querySelector(
        `[data-testid="${id}"]`
      ) as HTMLElement | null
    )?.textContent
      ?.replace(/\s+/g, ' ')
      .trim();
  return { fixture, text };
}

describe('RunVerdictComponent', () => {
  it('shows each passed check with what passed', () => {
    const { text } = render(sample().testEventDetails);

    expect(text('run-check-datalayer')).toContain('Passed');
    expect(text('run-check-datalayer-text')).toBe(
      'The site pushed add_to_cart with every key the spec requires.'
    );
    expect(text('run-check-request-text')).toBe(
      'GA4 received add_to_cart at G-8HKQR5ZBSK.'
    );
  });

  it('shows why a check failed, from the run', () => {
    const run = {
      ...sample().testEventDetails,
      passed: false,
      requestPassed: false,
      message: 'Key "ecommerce.value" is missing in the data layer',
      requestMessage: null,
      rawRequest: ''
    } as TestEventDetailSchema;
    const { fixture, text } = render(run);

    expect(text('run-check-datalayer-text')).toBe(
      'Key "ecommerce.value" is missing in the data layer'
    );
    expect(text('run-check-request-text')).toBe(
      'No GA4 request for add_to_cart was captured.'
    );
    expect(
      fixture.nativeElement.querySelectorAll('.verdict-card--failed')
    ).toHaveLength(2);
  });

  it('shows a run without the request check as passed, with the request check not checked', () => {
    const run = {
      ...sample().testEventDetails,
      requestPassed: false,
      requestChecked: false,
      rawRequest: ''
    } as TestEventDetailSchema;
    const { fixture, text } = render(run);

    expect(fixture.componentInstance.status()).toBe('passed');
    expect(text('run-check-request')).toContain('Not checked');
    expect(text('run-check-request-text')).toBe(
      'Request Check was off for this run, so it made no GA4 request check.'
    );
    expect(
      fixture.nativeElement.querySelectorAll('.verdict-card--failed')
    ).toHaveLength(0);
  });

  it('links each recent run, oldest first, and marks the shown one', () => {
    const { fixture, text } = render(sample().testEventDetails);

    const links = [
      ...fixture.nativeElement.querySelectorAll('.history-dot')
    ] as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Run #5: Partial',
      'Run #7: Passed'
    ]);
    expect(links[0].getAttribute('href')).toBe('/?run=5');
    expect(links[1].getAttribute('aria-current')).toBe('page');
    expect(text('run-history')).toContain('1 of the last 2 runs passed');
  });

  it(`shows at most the latest ${HISTORY_RUNS_SHOWN} runs`, () => {
    const runs = Array.from({ length: 30 }, (_, i) => ({
      runId: 30 - i,
      passed: true,
      requestPassed: true,
      runAt: new Date(0),
      hasRecording: false
    }));
    const { fixture } = render(sample().testEventDetails, runs);

    const links = fixture.nativeElement.querySelectorAll('.history-dot');
    expect(links).toHaveLength(HISTORY_RUNS_SHOWN);
    expect(links[HISTORY_RUNS_SHOWN - 1].getAttribute('aria-label')).toBe(
      'Run #30: Passed'
    );
  });

  it('says when the test has not run', () => {
    const { text } = render(null, []);

    expect(text('run-verdict-not-run')).toContain('This test has not run yet.');
  });

  it('keeps history without a Not run verdict when the requested run is missing', () => {
    const { fixture, text } = render(null);
    expect(text('run-verdict-not-run')).toBeUndefined();
    expect(text('run-history')).toContain('1 of the last 2 runs passed');
    expect(
      fixture.nativeElement.querySelector('[data-testid="run-history-5"]')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="run-history-7"]')
    ).not.toBeNull();
    expect(fixture.componentInstance.status()).not.toBe('notRun');
  });
});
