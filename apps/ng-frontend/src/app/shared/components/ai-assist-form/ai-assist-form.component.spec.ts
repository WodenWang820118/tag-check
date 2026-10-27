import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { AiAssistResponse } from '@utils';
import { AiAssistService } from '../../services/api/ai-assist/ai-assist.service';
import { AiAssistFormComponent } from './ai-assist-form.component';

/** GET /ai-assist as the page receives it (JSON). */
function response(readiness: unknown, enabled = false): AiAssistResponse {
  return JSON.parse(
    JSON.stringify({
      settings: {
        enabled,
        ollamaUrl: 'http://127.0.0.1:11434',
        model: 'qwen3.5:9b'
      },
      readiness
    })
  ) as AiAssistResponse;
}

const READY = response({
  kind: 'ready',
  version: '0.40.8',
  models: ['qwen3.5:9b', 'qwen3.5:4b']
});

async function render(
  service: Partial<Record<keyof AiAssistService, unknown>>
) {
  const snackBar = { open: vi.fn() };
  TestBed.configureTestingModule({
    imports: [AiAssistFormComponent],
    providers: [
      { provide: AiAssistService, useValue: service },
      { provide: MatSnackBar, useValue: snackBar }
    ]
  });
  const fixture = TestBed.createComponent(AiAssistFormComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const find = (id: string) =>
    element.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  return { fixture, component: fixture.componentInstance, find, snackBar };
}

describe('AiAssistFormComponent', () => {
  it('fills the form with the saved settings and shows they are ready', async () => {
    const { component, find } = await render({ get: () => of(READY) });

    expect(component.form.getRawValue()).toEqual(READY.settings);
    expect(find('ai-assist-status')?.textContent).toContain(
      'Connected · Ollama 0.40.8 · qwen3.5:9b is downloaded'
    );
    expect(find('ai-notice')).toBeNull();
  });

  it('offers the models Ollama has that match what is typed', async () => {
    const { component } = await render({ get: () => of(READY) });

    component.form.controls.model.setValue('4B');

    expect(component.modelOptions()).toEqual(['qwen3.5:4b']);
  });

  it('offers every model while Model names one', async () => {
    const { component } = await render({ get: () => of(READY) });

    expect(component.form.controls.model.value).toBe('qwen3.5:9b');
    expect(component.modelOptions()).toEqual(['qwen3.5:9b', 'qwen3.5:4b']);
  });

  it('shows what to do when Ollama is not running', async () => {
    const { component, find } = await render({
      get: () => of(response({ kind: 'runtimeUnavailable' }))
    });

    expect(find('ai-notice')?.textContent).toContain('Ollama is not running');
    expect(find('ai-assist-status')).toBeNull();
    expect(component.modelOptions()).toEqual([]);
  });

  it('says when the settings cannot be read', async () => {
    const { find } = await render({
      get: () =>
        throwError(() => new HttpErrorResponse({ status: 0, error: null }))
    });

    expect(find('ai-assist-error')?.textContent).toContain(
      'The AI assist settings could not be read.'
    );
  });

  it('saves the settings and shows the new state', async () => {
    const saved = response(
      { kind: 'ready', version: '0.40.8', models: ['qwen3.5:9b'] },
      true
    );
    const update = vi.fn().mockReturnValue(of(saved));
    const { component, snackBar } = await render({
      get: () => of(READY),
      update
    });

    component.form.controls.enabled.setValue(true);
    component.form.controls.model.setValue(' qwen3.5:9b ');
    await component.save();

    expect(update).toHaveBeenCalledWith({
      enabled: true,
      ollamaUrl: 'http://127.0.0.1:11434',
      model: 'qwen3.5:9b'
    });
    expect(component.state()).toEqual(saved);
    expect(component.form.dirty).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith(
      'AI assist settings saved.',
      'Close',
      expect.anything()
    );
  });

  it('does not save an address off this computer', async () => {
    const update = vi.fn();
    const { component } = await render({ get: () => of(READY), update });

    component.form.controls.ollamaUrl.setValue('http://10.0.0.2:11434');
    await component.save();

    expect(update).not.toHaveBeenCalled();
    expect(component.form.controls.ollamaUrl.hasError('ollamaUrl')).toBe(true);
  });

  it('shows why the backend refused the settings', async () => {
    const update = vi.fn().mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              statusCode: 400,
              path: '/ai-assist',
              message: {
                message: 'model must be an Ollama model name',
                error: 'Bad Request',
                statusCode: 400
              }
            }
          })
      )
    );
    const { component, snackBar } = await render({
      get: () => of(READY),
      update
    });

    await component.save();

    expect(snackBar.open).toHaveBeenCalledWith(
      'model must be an Ollama model name',
      'Close',
      expect.anything()
    );
    expect(component.saving()).toBe(false);
  });

  it('asks Ollama again without touching the form', async () => {
    const get = vi
      .fn()
      .mockReturnValueOnce(of(response({ kind: 'runtimeUnavailable' })))
      .mockReturnValueOnce(of(READY));
    const { component, fixture, find } = await render({ get });
    component.form.controls.model.setValue('qwen3.5:4b');
    component.form.markAsDirty();

    find('ai-notice-recheck')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(get).toHaveBeenCalledTimes(2);
    expect(component.form.controls.model.value).toBe('qwen3.5:4b');
    expect(find('ai-assist-status')).not.toBeNull();
  });
});
