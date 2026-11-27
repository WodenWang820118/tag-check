import { TestBed } from '@angular/core/testing';
import { RunStatusChipComponent } from './run-status-chip.component';

function render(
  status: 'notRun' | 'passed' | 'partial' | 'failed' | 'running',
  passed?: boolean,
  requestPassed?: boolean
) {
  const fixture = TestBed.createComponent(RunStatusChipComponent);
  fixture.componentRef.setInput('status', status);
  fixture.componentRef.setInput('passed', passed);
  fixture.componentRef.setInput('requestPassed', requestPassed);
  fixture.detectChanges();
  return fixture;
}

describe('RunStatusChipComponent', () => {
  it('shows one label per status', () => {
    for (const [status, label] of [
      ['notRun', 'Not run'],
      ['passed', 'Passed'],
      ['partial', 'Partial'],
      ['failed', 'Failed'],
      ['running', 'Running']
    ] as const) {
      const text = render(status).nativeElement.textContent as string;
      expect(text).toContain(label);
    }
  });

  it('lists both checks in the tooltip of a finished run', () => {
    const fixture = render('partial', true, false);
    expect(fixture.componentInstance.checks()).toBe(
      'Data layer: Passed · Request: Failed'
    );
  });

  it('says the request check was not made when the run skipped it', () => {
    const fixture = render('passed', true, false);
    fixture.componentRef.setInput('requestChecked', false);
    fixture.detectChanges();
    expect(fixture.componentInstance.checks()).toBe(
      'Data layer: Passed · Request: Not checked'
    );
  });

  it('says a test has not run instead of listing checks', () => {
    expect(render('notRun').componentInstance.checks()).toBe('Not run yet');
  });
});
