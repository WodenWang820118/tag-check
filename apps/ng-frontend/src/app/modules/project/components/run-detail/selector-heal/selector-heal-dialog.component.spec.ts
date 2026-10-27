import type { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NEVER, of, Subject, throwError, type Observable } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type {
  AiAssistResponse,
  Recording,
  SelectorSuggestionsResponse,
  StepFailureContext
} from '@utils';
import { AiAssistService } from '../../../../../shared/services/api/ai-assist/ai-assist.service';
import { RecordingService } from '../../../../../shared/services/api/recording/recording.service';
import { SelectorHealDialogComponent } from './selector-heal-dialog.component';

/** The API's JSON, as the page receives it. */
function json<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function ai(enabled = true, kind: 'ready' | 'runtimeUnavailable' = 'ready') {
  return json<AiAssistResponse>({
    settings: {
      enabled,
      ollamaUrl: 'http://127.0.0.1:11434',
      model: 'qwen3.5:9b'
    },
    readiness:
      kind === 'ready'
        ? { kind, version: '0.40.8', models: ['qwen3.5:9b'] }
        : { kind }
  });
}

const CANDIDATE = {
  index: 17,
  tag: 'button',
  role: 'button',
  name: 'Add to Cart',
  attributes: { 'data-testid': 'add-to-cart' },
  box: { x: 10, y: 20, width: 100, height: 40 },
  selectors: ['[data-testid="add-to-cart"]']
};

const CONTEXT = json<StepFailureContext>({
  stepIndex: 4,
  stepType: 'click',
  selectors: [
    { selector: '[data-testid="add-to-cart-old"]', matches: 0 },
    { selector: 'aria/Add to cart old', matches: null }
  ],
  timeoutMs: 15000,
  offset: { x: 58, y: 18 },
  url: 'https://shop.example/product/details/switzerland',
  title: 'Shop',
  viewport: { width: 1280, height: 800 },
  candidates: [CANDIDATE],
  candidatesFound: 131,
  capturedAt: '2026-10-27T10:00:00.000Z'
});

const ANSWER = json<SelectorSuggestionsResponse>({
  stepIndex: 4,
  stepType: 'click',
  model: 'qwen3.5:9b',
  considered: 23,
  suggestions: [{ candidate: CANDIDATE, reason: 'Same Add to Cart action' }]
});

function answerFor(
  items: { index: number; selectors: string[] }[]
): SelectorSuggestionsResponse {
  return {
    ...ANSWER,
    suggestions: items.map((item) => ({
      candidate: {
        ...CANDIDATE,
        index: item.index,
        selectors: item.selectors
      },
      reason: 'Same Add to Cart action'
    }))
  };
}

const RECORDING: Recording = {
  title: 'Add to cart',
  steps: [
    { type: 'navigate', url: 'https://shop.example/' },
    { type: 'click', selectors: [['#a']] },
    { type: 'click', selectors: [['#b']] },
    { type: 'click', selectors: [['#c']] },
    { type: 'click', selectors: [['[data-testid="add-to-cart-old"]']] }
  ]
};

function setUp(
  service: {
    get?: () => Observable<AiAssistResponse>;
    getStepFailure?: () => Observable<StepFailureContext>;
    suggest?: () => Observable<SelectorSuggestionsResponse>;
    trial?: ReturnType<typeof vi.fn>;
  } = {}
) {
  const backdrop = new Subject<MouseEvent>();
  const keys = new Subject<KeyboardEvent>();
  const dialogRef = {
    close: vi.fn(),
    backdropClick: () => backdrop,
    keydownEvents: () => keys
  };
  const aiAssist = {
    get: vi.fn(service.get ?? (() => of(ai()))),
    getStepFailure: vi.fn(service.getStepFailure ?? (() => of(CONTEXT))),
    suggest: vi.fn(service.suggest ?? (() => of(ANSWER))),
    trial:
      service.trial ??
      vi.fn(() => of({ runId: 42, passed: true, requestPassed: true }))
  };
  const recordings = {
    getRecordingDetails: vi.fn(() => of(RECORDING)),
    updateRecording: vi.fn((_slug: string, _id: string, r: Recording) => of(r))
  };
  const snackBar = { open: vi.fn() };
  TestBed.configureTestingModule({
    imports: [SelectorHealDialogComponent],
    providers: [
      provideRouter([]),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          projectSlug: 'demo',
          eventId: 'e1',
          runId: 37,
          stepLabel: 'Step 5 · Click [data-testid="add-to-cart-old"]'
        }
      },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: AiAssistService, useValue: aiAssist },
      { provide: RecordingService, useValue: recordings },
      { provide: MatSnackBar, useValue: snackBar }
    ]
  });
  const fixture = TestBed.createComponent(SelectorHealDialogComponent);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const find = (id: string) =>
    element.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const text = (id: string) =>
    find(id)?.textContent?.replace(/\s+/g, ' ').trim();
  /** Each list item's parts, joined by spaces. */
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
    aiAssist,
    recordings,
    snackBar,
    dialogRef,
    backdrop,
    keys
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

describe('SelectorHealDialogComponent', () => {
  it('shows what the run saw and asks the model at once when it is ready', () => {
    const { text, lines, aiAssist } = setUp();

    expect(aiAssist.getStepFailure).toHaveBeenCalledWith('demo', 'e1', 37);
    expect(aiAssist.suggest).toHaveBeenCalledWith('demo', 'e1', 37);
    expect(text('heal-model')).toBe('qwen3.5:9b on this computer · Ready');
    expect(lines('heal-seen')).toEqual([
      '[data-testid="add-to-cart-old"] 0 matches',
      'aria/Add to cart old could not be counted'
    ]);
    expect(text('heal-suggestion-17')).toContain('Add to Cart');
    expect(text('heal-suggestion-17')).toContain(
      "Model's reading, not checked: Same Add to Cart action"
    );
  });

  it('says AI assist is off, and does not ask', () => {
    const { find, aiAssist } = setUp({ get: () => of(ai(false)) });

    expect(find('heal-off')).not.toBeNull();
    expect(aiAssist.suggest).not.toHaveBeenCalled();
  });

  it('asks once Ollama is ready after a check', () => {
    const get = vi
      .fn()
      .mockReturnValueOnce(of(ai(true, 'runtimeUnavailable')))
      .mockReturnValueOnce(of(ai()));
    const { fixture, find, aiAssist } = setUp({ get });

    expect(find('ai-notice')).not.toBeNull();
    expect(aiAssist.suggest).not.toHaveBeenCalled();
    find('ai-notice-recheck')?.click();
    fixture.detectChanges();

    expect(aiAssist.suggest).toHaveBeenCalledTimes(1);
  });

  it('shows the wait, and why the model could not answer', () => {
    const waiting = setUp({ suggest: () => NEVER });
    expect(waiting.find('heal-asking')).not.toBeNull();
    TestBed.resetTestingModule();

    const failed = setUp({
      suggest: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 502,
              error: {
                statusCode: 502,
                message: {
                  message:
                    'The model did not answer with the requested JSON. Try again.'
                }
              }
            })
        )
    });
    expect(failed.text('heal-ask-error')).toBe(
      'The model did not answer with the requested JSON. Try again.'
    );
  });

  it('says when no element looks like the recorded one', () => {
    const { text } = setUp({
      suggest: () => of({ ...ANSWER, suggestions: [] })
    });

    expect(text('heal-none')).toContain('re-record this step');
  });

  it('drops a suggestion that is not the one', () => {
    const { fixture, find, component } = setUp();

    component.dismiss(component.suggestions()[0]);
    fixture.detectChanges();

    expect(find('heal-suggestion-17')).toBeNull();
    expect(find('heal-none')?.textContent).toContain('No suggestion left.');
  });

  it('tries a suggestion, shows the change, and saves it into the step', async () => {
    const {
      fixture,
      find,
      text,
      lines,
      aiAssist,
      recordings,
      snackBar,
      dialogRef
    } = setUp();

    find('heal-try-17')?.click();
    fixture.detectChanges();

    expect(aiAssist.trial).toHaveBeenCalledWith('demo', 'e1', {
      stepIndex: 4,
      selectors: ['[data-testid="add-to-cart"]']
    });
    expect(text('heal-trial-result')).toBe('Both checks passed (run #42).');
    expect(lines('heal-diff')).toEqual([
      '+ Added: [data-testid="add-to-cart"]',
      '− Removed: [data-testid="add-to-cart-old"]',
      '− Removed: aria/Add to cart old'
    ]);

    find('heal-save')?.click();
    await fixture.whenStable();

    const saved = recordings.updateRecording.mock.calls[0][2];
    expect(saved.steps[4].selectors).toEqual([['[data-testid="add-to-cart"]']]);
    expect(saved.steps[1]).toBe(RECORDING.steps[1]);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Step 5 now waits for the new selectors.',
      'Close',
      expect.anything()
    );
    expect(dialogRef.close).toHaveBeenCalledWith({ runId: 42 });
  });

  it('keeps the old selectors after the new ones when asked', async () => {
    const { fixture, find, component, recordings } = setUp();

    find('heal-try-17')?.click();
    component.keepOld.set(true);
    fixture.detectChanges();
    await component.save();

    expect(
      recordings.updateRecording.mock.calls[0][2].steps[4].selectors
    ).toEqual([
      ['[data-testid="add-to-cart"]'],
      ['[data-testid="add-to-cart-old"]']
    ]);
  });

  it('says why a trial did not pass, or did not finish', () => {
    const { fixture, find, text } = setUp({
      trial: vi.fn(() => of({ runId: 43, passed: true, requestPassed: false }))
    });
    find('heal-try-17')?.click();
    fixture.detectChanges();
    expect(text('heal-trial-result')).toBe(
      'The trial did not pass: dataLayer check passed, request check failed (run #43).'
    );
    TestBed.resetTestingModule();

    const failed = setUp({
      trial: vi.fn(() => throwError(() => new HttpErrorResponse({ status: 0 })))
    });
    failed.find('heal-try-17')?.click();
    failed.fixture.detectChanges();
    expect(failed.find('heal-trial')?.textContent).toContain(
      'The trial run did not finish.'
    );
  });

  it('closes with the trial run to show, however it is closed', () => {
    const { fixture, find, dialogRef, keys, backdrop } = setUp();

    backdrop.next(new MouseEvent('click'));
    expect(dialogRef.close).toHaveBeenLastCalledWith(undefined);

    find('heal-try-17')?.click();
    fixture.detectChanges();
    keys.next(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(dialogRef.close).toHaveBeenLastCalledWith({ runId: 42 });
  });

  it('saves only the selectors of a suggestion that stay ticked', async () => {
    const structural = 'body > app-root > div > button';
    const { fixture, find, lines, recordings } = setUp({
      suggest: () =>
        of(
          answerFor([
            {
              index: 17,
              selectors: ['[data-testid="add-to-cart"]', structural]
            }
          ])
        )
    });

    find('heal-try-17')?.click();
    fixture.detectChanges();
    untick(fixture.debugElement, 1);
    fixture.detectChanges();

    expect(lines('heal-diff')[0]).toBe('+ Added: [data-testid="add-to-cart"]');
    expect(lines('heal-diff')[1]).toBe(`+ Not saved: ${structural}`);

    find('heal-save')?.click();
    await fixture.whenStable();

    const saved = recordings.updateRecording.mock.calls[0][2];
    expect(saved.steps[4].selectors).toEqual([['[data-testid="add-to-cart"]']]);
  });

  it('clears unticked selectors when another suggestion is tried', () => {
    const structural = 'body > app-root > div > button';
    const { fixture, find, component, lines } = setUp({
      suggest: () =>
        of(
          answerFor([
            {
              index: 17,
              selectors: ['[data-testid="add-to-cart"]', structural]
            },
            {
              index: 18,
              selectors: ['[data-testid="buy-now"]', structural]
            }
          ])
        )
    });

    find('heal-try-17')?.click();
    fixture.detectChanges();
    untick(fixture.debugElement, 1);
    fixture.detectChanges();
    expect(component.excluded()).toEqual([structural]);

    component.backToSuggestions();
    fixture.detectChanges();
    expect(component.excluded()).toEqual([]);

    find('heal-try-18')?.click();
    fixture.detectChanges();
    untick(fixture.debugElement, 1);
    fixture.detectChanges();
    expect(component.excluded()).toEqual([structural]);

    component.tryIt(component.suggestions()[0]);
    fixture.detectChanges();

    expect(component.excluded()).toEqual([]);
    expect(lines('heal-diff')[0]).toBe('+ Added: [data-testid="add-to-cart"]');
    expect(lines('heal-diff')[1]).toBe(`+ Added: ${structural}`);
  });

  it('says when what the run saw cannot be read', () => {
    const { text } = setUp({
      getStepFailure: () =>
        throwError(() => new HttpErrorResponse({ status: 404 }))
    });

    expect(text('heal-load-error')).toBe(
      'What this run saw could not be read.'
    );
  });
});
