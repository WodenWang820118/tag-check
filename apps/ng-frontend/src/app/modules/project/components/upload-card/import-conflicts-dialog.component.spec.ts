import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { describe, expect, it, vi } from 'vitest';
import type { GtmImportConflict } from '@utils';
import { ImportConflictsDialogComponent } from './import-conflicts-dialog.component';

/** Conflicts as POST gtm-parser/preview returns them. */
const CONFLICTS = JSON.parse(
  JSON.stringify([
    {
      tagName: 'GA4 - purchase',
      existingEventName: 'purchase',
      newEventName: 'begin_checkout',
      specEdited: true
    },
    {
      tagName: 'GA4 - refund',
      existingEventName: 'refund',
      newEventName: 'refund_issued',
      specEdited: false
    }
  ])
) as GtmImportConflict[];

function render(conflicts: GtmImportConflict[] = CONFLICTS) {
  const dialogRef = { close: vi.fn() };
  TestBed.configureTestingModule({
    imports: [ImportConflictsDialogComponent],
    providers: [
      provideNoopAnimations(),
      { provide: MAT_DIALOG_DATA, useValue: { conflicts } },
      { provide: MatDialogRef, useValue: dialogRef }
    ]
  });
  const fixture = TestBed.createComponent(ImportConflictsDialogComponent);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const query = (testId: string): HTMLElement => {
    const found = element.querySelector<HTMLElement>(
      `[data-testid="${testId}"]`
    );
    if (!found) {
      throw new Error(`${testId} not found`);
    }
    return found;
  };
  const text = (testId: string) =>
    query(testId).textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const choose = (testId: string) => {
    const input = query(testId);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error(`${testId} is not a choice`);
    }
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  return { dialogRef, query, text, choose };
}

describe('ImportConflictsDialogComponent', () => {
  it('starts on Update, toggles, and closes with the chosen record', () => {
    const { dialogRef, query, text, choose } = render();

    const purchaseUpdate = query('import-conflict-update-0');
    const purchaseKeep = query('import-conflict-keep-0');
    const refundUpdate = query('import-conflict-update-1');
    expect(purchaseUpdate).toBeInstanceOf(HTMLInputElement);
    expect(purchaseKeep).toBeInstanceOf(HTMLInputElement);
    expect(refundUpdate).toBeInstanceOf(HTMLInputElement);
    if (
      purchaseUpdate instanceof HTMLInputElement &&
      purchaseKeep instanceof HTMLInputElement &&
      refundUpdate instanceof HTMLInputElement
    ) {
      expect(purchaseUpdate.checked).toBe(true);
      expect(purchaseKeep.checked).toBe(false);
      expect(refundUpdate.checked).toBe(true);
    }

    expect(text('import-conflict-0')).toContain('GA4 - purchase');
    expect(text('import-conflict-0')).toContain('purchase → begin_checkout');
    expect(text('import-conflict-0')).toContain('The spec was edited');
    expect(text('import-conflict-0')).toContain('GA4 - purchase (1)');
    expect(text('import-conflict-1')).not.toContain('The spec was edited');
    expect(text('import-conflict-1')).toContain('GA4 - refund (1)');

    choose('import-conflict-keep-0');
    choose('import-conflict-update-0');
    choose('import-conflict-keep-1');
    query('import-conflicts-confirm').click();

    expect(dialogRef.close).toHaveBeenCalledWith({
      'GA4 - purchase': 'update',
      'GA4 - refund': 'keepBoth'
    });
  });

  it('shows the next free name it can see when an earlier suffix exists', () => {
    const conflicts = JSON.parse(
      JSON.stringify([
        {
          tagName: 'X',
          existingEventName: 'purchase',
          newEventName: 'begin_checkout',
          specEdited: false
        },
        {
          tagName: 'X (1)',
          existingEventName: 'begin_checkout',
          newEventName: 'view_item',
          specEdited: false
        }
      ])
    ) as GtmImportConflict[];
    const { text } = render(conflicts);

    expect(text('import-conflict-0')).toContain('Keep both as X (2)');
    expect(text('import-conflict-1')).toContain('Keep both as X (1) (1)');
  });

  it('cancel closes without a resolution', () => {
    const { dialogRef, query } = render();
    query('import-conflicts-cancel').click();
    expect(dialogRef.close).toHaveBeenCalledWith(undefined);
  });
});
