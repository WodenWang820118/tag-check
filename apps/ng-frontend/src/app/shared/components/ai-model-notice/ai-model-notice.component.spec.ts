import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import type { AiAssistReadiness } from '@utils';
import { AiModelNoticeComponent } from './ai-model-notice.component';

function render(readiness: AiAssistReadiness | null, checking = false) {
  TestBed.configureTestingModule({ imports: [AiModelNoticeComponent] });
  const fixture = TestBed.createComponent(AiModelNoticeComponent);
  fixture.componentRef.setInput('readiness', readiness);
  fixture.componentRef.setInput('model', 'qwen3.5:9b');
  fixture.componentRef.setInput('checking', checking);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const find = (id: string) =>
    element.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  return { fixture, element, find };
}

describe('AiModelNoticeComponent', () => {
  it('asks to start Ollama when it does not answer', () => {
    const { find } = render({ kind: 'runtimeUnavailable' });

    expect(find('ai-notice')?.textContent).toContain('Ollama is not running');
    expect(find('ai-notice-command')).toBeNull();
  });

  it('shows the command that downloads a missing model', () => {
    const { find } = render({
      kind: 'modelMissing',
      version: '0.40.8',
      models: [],
      command: 'ollama pull qwen3.5:9b'
    });

    expect(find('ai-notice')?.textContent).toContain(
      'qwen3.5:9b is not downloaded'
    );
    expect(find('ai-notice-command')?.textContent).toBe(
      'ollama pull qwen3.5:9b'
    );
  });

  it('says Copied once the command is copied', () => {
    const { fixture, find } = render({
      kind: 'modelMissing',
      version: '0.40.8',
      models: [],
      command: 'ollama pull qwen3.5:9b'
    });

    fixture.componentInstance.onCopied(true);
    fixture.detectChanges();

    expect(find('ai-notice-copy')?.textContent?.trim()).toBe('Copied');
  });

  it('shows nothing once the model is ready, or before a check', () => {
    expect(
      render({ kind: 'ready', version: '0.40.8', models: ['qwen3.5:9b'] }).find(
        'ai-notice'
      )
    ).toBeNull();
    TestBed.resetTestingModule();
    expect(render(null).find('ai-notice')).toBeNull();
  });

  it('asks to check again, unless a check runs', () => {
    const { fixture, find } = render({ kind: 'runtimeUnavailable' });
    const recheck = vi.fn();
    fixture.componentInstance.recheck.subscribe(recheck);

    find('ai-notice-recheck')?.click();

    expect(recheck).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('checking', true);
    fixture.detectChanges();
    expect(
      (find('ai-notice-recheck') as HTMLButtonElement | null)?.disabled
    ).toBe(true);
  });
});
