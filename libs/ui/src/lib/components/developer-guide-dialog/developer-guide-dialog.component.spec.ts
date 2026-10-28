import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StrictDataLayerEvent } from '@utils';
import {
  DeveloperGuideDialogComponent,
  type DeveloperGuideDialogData
} from './developer-guide-dialog.component';

/** Spec fixtures hold rule values (strings, booleans) the spec type omits. */
const asSpecs = (value: object[]): StrictDataLayerEvent[] =>
  value as StrictDataLayerEvent[];

describe('DeveloperGuideDialogComponent', () => {
  let fixture: ComponentFixture<DeveloperGuideDialogComponent>;
  let component: DeveloperGuideDialogComponent;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  async function createComponent(
    data: DeveloperGuideDialogData | null
  ): Promise<void> {
    dialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DeveloperGuideDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeveloperGuideDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('empty state', () => {
    beforeEach(async () => {
      await createComponent({ specs: [] });
    });

    it('displays the empty state message when no events exist in the input', () => {
      const emptyEl = fixture.nativeElement.querySelector(
        '[data-testid="tagbuild-developer-empty"]'
      );
      expect(emptyEl).not.toBeNull();
      expect(emptyEl?.textContent).toContain('No events in the input');
    });

    it('disables Copy all and Download buttons when there are no events', () => {
      const copyBtn: HTMLButtonElement | null =
        fixture.nativeElement.querySelector(
          '[data-testid="tagbuild-developer-copy"]'
        );
      const downloadBtn: HTMLButtonElement | null =
        fixture.nativeElement.querySelector(
          '[data-testid="tagbuild-developer-download"]'
        );

      expect(copyBtn?.disabled).toBe(true);
      expect(downloadBtn?.disabled).toBe(true);
    });
  });

  describe('with events', () => {
    const mockSpecs = asSpecs([
      {
        event: 'purchase',
        ecommerce: {
          transaction_id: '/^T\\d+$/',
          currency: 'TWD',
          value: '$value',
          items: [{ item_id: '$item_id' }]
        }
      },
      {
        event: 'login',
        method: '$method'
      }
    ]);

    beforeEach(async () => {
      await createComponent({ specs: mockSpecs });
    });

    it('lists snippets for each event in the input', () => {
      expect(component.snippets).toHaveLength(2);
      expect(component.snippets[0].eventName).toBe('purchase');
      expect(component.snippets[1].eventName).toBe('login');

      const cardEls = fixture.nativeElement.querySelectorAll(
        '.developer-guide-dialog__card'
      );
      expect(cardEls.length).toBe(2);

      const emptyEl = fixture.nativeElement.querySelector(
        '[data-testid="tagbuild-developer-empty"]'
      );
      expect(emptyEl).toBeNull();
    });

    it('enables the Copy all and Download buttons', () => {
      const copyBtn: HTMLButtonElement | null =
        fixture.nativeElement.querySelector(
          '[data-testid="tagbuild-developer-copy"]'
        );
      const downloadBtn: HTMLButtonElement | null =
        fixture.nativeElement.querySelector(
          '[data-testid="tagbuild-developer-download"]'
        );

      expect(copyBtn?.disabled).toBe(false);
      expect(downloadBtn?.disabled).toBe(false);
    });

    it('copies all snippets to clipboard when Copy all is clicked', async () => {
      // jsdom has no clipboard: stand one in, as the conversion dialog spec does.
      const writeTextSpy = vi
        .fn<(text: string) => Promise<void>>()
        .mockResolvedValue(undefined);
      Object.defineProperty(globalThis.navigator, 'clipboard', {
        configurable: true,
        value: { writeText: writeTextSpy }
      });

      const copyBtn: HTMLButtonElement | null =
        fixture.nativeElement.querySelector(
          '[data-testid="tagbuild-developer-copy"]'
        );
      copyBtn?.click();

      expect(writeTextSpy).toHaveBeenCalled();
      const copiedText = writeTextSpy.mock.calls[0]?.[0] ?? '';
      expect(copiedText).toContain('// purchase:');
      expect(copiedText).toContain('// login:');
    });

    it('triggers a download of dataLayer-snippets.js when Download is clicked', () => {
      const createObjectURL = vi
        .spyOn(URL, 'createObjectURL')
        .mockReturnValue('blob:test');
      const revokeObjectURL = vi
        .spyOn(URL, 'revokeObjectURL')
        .mockReturnValue(undefined);

      const downloadSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

      const downloadBtn: HTMLButtonElement | null =
        fixture.nativeElement.querySelector(
          '[data-testid="tagbuild-developer-download"]'
        );
      downloadBtn?.click();

      expect(createObjectURL).toHaveBeenCalled();
      expect(downloadSpy).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('closes the dialog when the Close button is clicked', () => {
      const closeButtons = fixture.nativeElement.querySelectorAll('button');
      let closeBtn: HTMLButtonElement | null = null;
      for (const btn of closeButtons) {
        if (btn.textContent?.includes('Close')) {
          closeBtn = btn;
          break;
        }
      }
      closeBtn?.click();
      expect(dialogRef.close).toHaveBeenCalled();
    });
  });
});
