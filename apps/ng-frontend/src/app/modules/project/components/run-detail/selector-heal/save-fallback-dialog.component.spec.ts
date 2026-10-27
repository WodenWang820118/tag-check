import type { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, type Observable } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { Recording, ReportDetailResponse, StepFallback } from '@utils';
import { RecordingService } from '../../../../../shared/services/api/recording/recording.service';
import { SaveFallbackDialogComponent } from './save-fallback-dialog.component';

/** A fallback as GET /reports/:projectSlug/:eventId sends it. */
const FALLBACK = (
  JSON.parse(
    JSON.stringify({
      stepFallbacks: [
        {
          stepIndex: 1,
          stepType: 'click',
          selector: '[data-testid="add-to-cart"]',
          selectors: ['[data-testid="add-to-cart"]', 'main > button'],
          matchedBy: 'testId',
          value: 'add-to-cart'
        }
      ]
    })
  ) as Pick<ReportDetailResponse, 'stepFallbacks'>
).stepFallbacks[0] as StepFallback;

const RECORDING: Recording = {
  title: 'Add to cart',
  steps: [
    { type: 'navigate', url: 'https://shop.example/' },
    {
      type: 'click',
      selectors: [['main > div.old > [data-testid="add-to-cart"]']]
    }
  ]
};

function setUp(
  recording: () => Observable<Recording> = () => of(RECORDING),
  update: () => Observable<Recording> = () => of(RECORDING)
) {
  const dialogRef = { close: vi.fn() };
  const recordings = {
    getRecordingDetails: vi.fn(recording),
    updateRecording: vi.fn(
      (_slug: string, _eventId: string, _recording: Recording) => update()
    )
  };
  const snackBar = { open: vi.fn() };
  TestBed.configureTestingModule({
    imports: [SaveFallbackDialogComponent],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          projectSlug: 'demo',
          eventId: 'e1',
          fallback: FALLBACK,
          stepLabel: 'Step 2 · Click'
        }
      },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: RecordingService, useValue: recordings },
      { provide: MatSnackBar, useValue: snackBar }
    ]
  });
  const fixture = TestBed.createComponent(SaveFallbackDialogComponent);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const find = (id: string) =>
    element.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const text = (id: string) =>
    find(id)?.textContent?.replace(/\s+/g, ' ').trim();
  const lines = (id: string) =>
    [...(find(id)?.querySelectorAll('li') ?? [])].map((item) =>
      [...item.children]
        .map((part) => part.textContent?.trim())
        .filter(Boolean)
        .join(' ')
    );
  return {
    fixture,
    component: fixture.componentInstance,
    find,
    text,
    lines,
    recordings,
    snackBar,
    dialogRef
  };
}

/** Unticks one added selector, as its checkbox change does. */
function untick(debugElement: DebugElement, index: number): void {
  const pick = debugElement.query(
    By.css(`[data-testid="selector-diff-pick-${index}"]`)
  );
  if (!pick) {
    throw new Error(`No selector-diff-pick-${index}`);
  }
  pick.triggerEventHandler('change', {});
}

describe('SaveFallbackDialogComponent', () => {
  it('says why the fallback was used and how the step changes', () => {
    const { text, lines, recordings } = setUp();

    expect(recordings.getRecordingDetails).toHaveBeenCalledWith('demo', 'e1');
    expect(text('fallback-dialog')).toContain(
      'Step 2 · Click found nothing with its recorded selectors, so the run continued with [data-testid="add-to-cart"]: one element matched the recorded test hook "add-to-cart".'
    );
    expect(lines('fallback-diff')).toEqual([
      '+ Added: [data-testid="add-to-cart"]',
      '+ Added: main > button',
      '− Removed: main > div.old > [data-testid="add-to-cart"]'
    ]);
  });

  it('writes the fallback into the step, then closes', async () => {
    const { fixture, find, recordings, snackBar, dialogRef } = setUp();

    find('fallback-save')?.click();
    await fixture.whenStable();

    const [slug, id, saved] = recordings.updateRecording.mock.calls[0] ?? [];
    expect([slug, id]).toEqual(['demo', 'e1']);
    expect(saved?.steps[1]?.selectors).toEqual([
      ['[data-testid="add-to-cart"]'],
      ['main > button']
    ]);
    expect(saved?.steps[0]).toBe(RECORDING.steps[0]);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Step 2 now waits for the fallback selector.',
      'Close',
      expect.anything()
    );
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('keeps the old selectors after the new ones when asked', async () => {
    const { component, recordings } = setUp();

    component.keepOld.set(true);
    await component.save();

    const saved = recordings.updateRecording.mock.calls[0]?.[2];
    expect(saved?.steps[1]?.selectors).toEqual([
      ['[data-testid="add-to-cart"]'],
      ['main > button'],
      ['main > div.old > [data-testid="add-to-cart"]']
    ]);
  });

  it('does not save again when the step already waits for it', () => {
    const { find, text } = setUp(() =>
      of({
        ...RECORDING,
        steps: [
          RECORDING.steps[0],
          { type: 'click', selectors: [['[data-testid="add-to-cart"]']] }
        ]
      })
    );

    expect(text('fallback-saved')).toBe(
      'The recording already waits for this selector first.'
    );
    expect(find('fallback-diff')).toBeNull();
    expect(find('fallback-save')?.hasAttribute('disabled')).toBe(true);
  });

  it('says when the recording cannot be read', () => {
    const { find, text } = setUp(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { message: 'No recording' }
          })
      )
    );

    expect(text('fallback-error')).toBe('No recording');
    expect(find('fallback-save')?.hasAttribute('disabled')).toBe(true);
  });

  it('saves only the new selectors that stay ticked', async () => {
    const { fixture, find, recordings } = setUp();

    untick(fixture.debugElement, 1);
    fixture.detectChanges();
    find('fallback-save')?.click();
    await fixture.whenStable();

    const saved = recordings.updateRecording.mock.calls[0]?.[2];
    expect(saved?.steps[1]?.selectors).toEqual([
      ['[data-testid="add-to-cart"]']
    ]);
  });

  it('disables save when every new selector is unticked', () => {
    const { fixture, find, text } = setUp();

    untick(fixture.debugElement, 0);
    untick(fixture.debugElement, 1);
    fixture.detectChanges();

    expect(find('fallback-save')?.hasAttribute('disabled')).toBe(true);
    expect(text('fallback-pick-none')).toBe(
      'Tick at least one new selector to save.'
    );
  });

  it('counts the step saved when it waits for the first ticked selector', () => {
    const { fixture, find, text } = setUp(() =>
      of({
        ...RECORDING,
        steps: [
          RECORDING.steps[0],
          { type: 'click', selectors: [['main > button']] }
        ]
      })
    );

    expect(find('fallback-saved')).toBeNull();
    untick(fixture.debugElement, 0);
    fixture.detectChanges();

    expect(text('fallback-saved')).toBe(
      'The recording already waits for this selector first.'
    );
    expect(find('fallback-diff')).toBeNull();
    expect(find('fallback-save')?.hasAttribute('disabled')).toBe(true);
  });

  it('stays open and says so when the save fails', async () => {
    const { component, snackBar, dialogRef } = setUp(undefined, () =>
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    await component.save();

    expect(snackBar.open).toHaveBeenCalledWith(
      'The recording could not be saved.',
      'Close',
      expect.anything()
    );
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });
});
