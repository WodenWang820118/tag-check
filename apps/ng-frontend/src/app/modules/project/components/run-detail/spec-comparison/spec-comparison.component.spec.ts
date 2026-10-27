import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { REPORT_DETAIL_SAMPLE } from '@utils';
import {
  showValue,
  SpecComparisonComponent
} from './spec-comparison.component';

function render(
  spec: Record<string, unknown> | undefined,
  dataLayer: unknown[] | undefined
) {
  TestBed.configureTestingModule({ imports: [SpecComparisonComponent] });
  const fixture = TestBed.createComponent(SpecComparisonComponent);
  fixture.componentRef.setInput('spec', spec);
  fixture.componentRef.setInput('dataLayer', dataLayer);
  fixture.detectChanges();
  const rows = () =>
    (
      [...fixture.nativeElement.querySelectorAll('tbody tr')] as HTMLElement[]
    ).map((row) =>
      (
        [
          ...row.querySelectorAll('td > code, td > span, td:last-child')
        ] as HTMLElement[]
      ).map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim())
    );
  return { fixture, rows };
}

// The example project's add_to_cart spec, and the push the run saved (JSON).
const SPEC = {
  event: 'add_to_cart',
  ecommerce: {
    value: '{{DLV - ecommerce.value}}',
    currency: '{{DLV - ecommerce.currency}}'
  }
};
const DATA_LAYER = JSON.parse(
  JSON.stringify(REPORT_DETAIL_SAMPLE.testEventDetails.dataLayer)
);

describe('SpecComparisonComponent', () => {
  it('shows each spec key next to what was pushed', () => {
    const { fixture, rows } = render(SPEC, DATA_LAYER);

    // Key, what the spec asks, its value, what was pushed, the result.
    expect(rows()).toEqual([
      ['event', 'equal to', '"add_to_cart"', '"add_to_cart"', 'Match'],
      [
        'ecommerce.value',
        'any value',
        '{{DLV - ecommerce.value}}',
        '799',
        'Present'
      ],
      [
        'ecommerce.currency',
        'any value',
        '{{DLV - ecommerce.currency}}',
        '"USD"',
        'Present'
      ]
    ]);
    const extras = fixture.nativeElement.querySelector(
      '[data-testid="spec-extras"]'
    );
    expect(extras.textContent).toContain('Captured, not in the spec (1)');
    expect(extras.textContent).toContain('ecommerce.items');
  });

  it('marks failed keys and says when nothing was pushed', () => {
    const { fixture, rows } = render(SPEC, undefined);

    expect(rows().map((row) => [row[0], row.at(-1)])).toEqual([
      ['event', 'missing'],
      ['ecommerce', 'missing']
    ]);
    expect(fixture.nativeElement.textContent).toContain(
      'The run captured no push for this event'
    );
    expect(
      fixture.nativeElement.querySelectorAll('.comparison-failed')
    ).toHaveLength(2);
  });

  it('says when the test has no spec', () => {
    const { fixture } = render(undefined, DATA_LAYER);

    expect(fixture.nativeElement.textContent).toContain(
      'This test has no spec yet.'
    );
  });

  it('shows values as JSON, with strings in quotes', () => {
    expect(showValue('USD')).toBe('"USD"');
    expect(showValue(799)).toBe('799');
    expect(showValue([{ id: 1 }])).toBe('[{"id":1}]');
    expect(showValue(undefined)).toBe('—');
  });
});
