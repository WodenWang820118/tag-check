import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { REPORT_DETAIL_SAMPLE } from '@utils';
import { Ga4RequestComponent } from './ga4-request.component';

function render(rawRequest: string | undefined, requestPassed: boolean) {
  TestBed.configureTestingModule({ imports: [Ga4RequestComponent] });
  const fixture = TestBed.createComponent(Ga4RequestComponent);
  fixture.componentRef.setInput('rawRequest', rawRequest);
  fixture.componentRef.setInput('requestPassed', requestPassed);
  fixture.componentRef.setInput('eventName', 'add_to_cart');
  fixture.detectChanges();
  // The text of each cell of a part, joined with spaces.
  const part = (id: string) => {
    const root = fixture.nativeElement.querySelector(
      `[data-testid="${id}"]`
    ) as HTMLElement | null;
    if (!root) {
      return undefined;
    }
    const cells = [
      ...root.querySelectorAll('dt, dd, th, td, p')
    ] as HTMLElement[];
    return (cells.length ? cells : [root])
      .map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim())
      .join(' ');
  };
  return { fixture, part };
}

describe('Ga4RequestComponent', () => {
  it('reads the captured request: event, measurement ID, parameters and items', () => {
    const { fixture, part } = render(
      REPORT_DETAIL_SAMPLE.testEventDetails.rawRequest,
      true
    );

    expect(part('ga4-request-event')).toBe(
      'Event add_to_cart Measurement ID G-8HKQR5ZBSK'
    );
    expect(part('ga4-request-parameters')).toBe(
      'value 799 number currency USD text'
    );
    expect(part('ga4-request-items')).toBe(
      'item_id item_name quantity price city001 Switzerland 1 799'
    );
    expect(part('ga4-request-missing')).toBeUndefined();
    expect(
      fixture.nativeElement.querySelector('[data-testid="ga4-request-copy"]')
    ).not.toBeNull();
  });

  it('shows the copy as done once copied', () => {
    const { fixture } = render(
      REPORT_DETAIL_SAMPLE.testEventDetails.rawRequest,
      true
    );

    fixture.componentInstance.onCopied(true);
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('[data-testid="ga4-request-copy"]')
        .textContent.trim()
    ).toBe('Copied');
  });

  it('says where to look when no request was captured', () => {
    const { fixture, part } = render('', false);

    expect(part('ga4-request-missing')).toContain(
      'No matching request was captured'
    );
    expect(fixture.nativeElement.textContent).toContain('Where to look');
    expect(
      fixture.nativeElement.querySelector('[data-testid="ga4-request-copy"]')
    ).toBeNull();
  });
});
