import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it } from 'vitest';
import { ReportTabViewModel } from '../report-detail.contracts';
import { ReportTabViewComponent } from './report-tab-view.component';

const notRun: ReportTabViewModel = {
  title: 'GA4 event - add_to_cart',
  lastRunAt: undefined,
  status: 'notRun',
  passed: false,
  eventName: 'add_to_cart',
  message: 'This is a standard test',
  showHistory: false,
  showShareMenu: false,
  canExportSpreadsheet: false,
  canExportRecording: false,
  canExportEvent: false,
  hasMedia: false,
  videoBlob: undefined,
  tagAssistantVideoBlob: undefined,
  imageBlob: undefined
};

function render(viewModel: ReportTabViewModel): HTMLElement {
  TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
  const fixture = TestBed.createComponent(ReportTabViewComponent);
  fixture.componentRef.setInput('viewModel', viewModel);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

function renderText(viewModel: ReportTabViewModel): string {
  return render(viewModel).textContent ?? '';
}

function messageOf(viewModel: ReportTabViewModel): string | undefined {
  return render(viewModel)
    .querySelector('[data-testid="result-message"]')
    ?.textContent?.trim();
}

describe('ReportTabViewComponent message', () => {
  it('shows the test message as text', () => {
    expect(messageOf(notRun)).toBe('This is a standard test');
  });

  it('shows a dash when the test has no message', () => {
    expect(messageOf({ ...notRun, message: '' })).toBe('—');
  });
});

describe('ReportTabViewComponent media card', () => {
  it('asks to run a test that has not run', () => {
    const text = renderText(notRun);

    expect(text).toContain(
      'Run the test to capture a screenshot and a recording of the run.'
    );
    expect(text).not.toContain('may be disabled');
  });

  it('says when a run saved no screenshot or recording', () => {
    const text = renderText({
      ...notRun,
      status: 'failed',
      lastRunAt: '2026-10-20T06:21:19.000Z',
      showHistory: true
    });

    expect(text).toContain('This run saved no screenshot or recording.');
  });
});
