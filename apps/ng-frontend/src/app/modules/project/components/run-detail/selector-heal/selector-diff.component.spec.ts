import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it } from 'vitest';
import { SelectorDiffComponent } from './selector-diff.component';
import type { SelectorChange } from './selector-heal';

const CHANGES: SelectorChange[] = [
  { change: 'add', selector: '[data-testid="add-to-cart"]' },
  { change: 'add', selector: 'main > button' },
  { change: 'remove', selector: 'main > div.old > button' },
  { change: 'keep', selector: 'aria/Add to cart' }
];

function setUp(
  inputs: {
    selectable?: boolean;
    excluded?: readonly string[];
  } = {}
) {
  TestBed.configureTestingModule({
    imports: [SelectorDiffComponent],
    providers: [provideNoopAnimations()]
  });
  const fixture = TestBed.createComponent(SelectorDiffComponent);
  fixture.componentRef.setInput('changes', CHANGES);
  fixture.componentRef.setInput('selectable', inputs.selectable ?? false);
  fixture.componentRef.setInput('excluded', inputs.excluded ?? []);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const lines = () =>
    [...element.querySelectorAll('li')].map((item) =>
      [...item.children]
        .map((part) => part.textContent?.trim())
        .filter(Boolean)
        .join(' ')
    );
  return { fixture, component: fixture.componentInstance, element, lines };
}

function nativeBox(root: ParentNode): HTMLInputElement | null {
  const input = root.querySelector('input');
  return input instanceof HTMLInputElement ? input : null;
}

describe('SelectorDiffComponent', () => {
  it('lists each selector without checkboxes unless asked', () => {
    const plain = setUp({ excluded: ['main > button'] });

    expect(plain.element.querySelector('mat-checkbox')).toBeNull();
    expect(plain.lines()).toEqual([
      '+ Added: [data-testid="add-to-cart"]',
      '+ Added: main > button',
      '− Removed: main > div.old > button',
      'Kept: aria/Add to cart'
    ]);
  });

  it('offers a checkbox only on each added selector', () => {
    const { element } = setUp({ selectable: true });
    const picks = [
      ...element.querySelectorAll<HTMLElement>(
        '[data-testid^="selector-diff-pick-"]'
      )
    ];

    expect(picks.map((pick) => pick.getAttribute('data-testid'))).toEqual([
      'selector-diff-pick-0',
      'selector-diff-pick-1'
    ]);
    expect(element.querySelector('[data-testid="selector-diff-pick-2"]')).toBe(
      null
    );
    expect(element.querySelector('[data-testid="selector-diff-pick-3"]')).toBe(
      null
    );
    expect(
      picks.map((pick) => nativeBox(pick)?.getAttribute('aria-label'))
    ).toEqual(['Save [data-testid="add-to-cart"]', 'Save main > button']);
    expect(picks.every((pick) => nativeBox(pick)?.checked === true)).toBe(true);
  });

  it('shows an unticked selector as not saved and reports its tick', () => {
    const { fixture, component, element, lines } = setUp({
      selectable: true,
      excluded: ['main > button']
    });
    const row = element.querySelectorAll('li')[1];
    const emitted: string[] = [];
    component.toggle.subscribe((selector) => emitted.push(selector));

    expect(lines()[1]).toBe('+ Not saved: main > button');
    expect(row?.classList.contains('diff__line--add')).toBe(false);
    expect(row?.classList.contains('line-through')).toBe(true);
    // The row's own marker; the checkbox holds hidden parts of its own.
    expect(
      row?.querySelector(':scope > span[aria-hidden="true"]')?.textContent
    ).toBe('+');
    expect(row ? nativeBox(row)?.checked : true).toBe(false);
    expect(
      element.querySelectorAll('li')[0]?.classList.contains('diff__line--add')
    ).toBe(true);

    fixture.debugElement
      .query(By.css('[data-testid="selector-diff-pick-1"]'))
      ?.triggerEventHandler('change', {});
    fixture.detectChanges();

    expect(emitted).toEqual(['main > button']);
  });
});
