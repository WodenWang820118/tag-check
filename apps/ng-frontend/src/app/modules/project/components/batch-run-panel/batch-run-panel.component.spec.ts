import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';
import {
  BatchItem,
  BatchRun,
  BatchRunService
} from '../../services/batch-run/batch-run.service';
import { BatchRunPanelComponent } from './batch-run-panel.component';

function item(
  eventName: string,
  status: BatchItem['status'],
  message?: string
): BatchItem {
  return { eventId: `id-${eventName}`, eventName, status, message };
}

function render(batch: BatchRun | null, running: boolean) {
  const state = signal(batch);
  const isRunning = signal(running);
  const service = {
    batch: state.asReadonly(),
    isRunning: isRunning.asReadonly(),
    currentItem: computed(() =>
      state()?.items.find((entry) => entry.status === 'running')
    ),
    doneCount: computed(
      () =>
        state()?.items.filter(
          (entry) => entry.status !== 'pending' && entry.status !== 'running'
        ).length ?? 0
    ),
    canResume: computed(
      () =>
        !isRunning() &&
        (state()?.items.some((entry) => entry.status === 'pending') ?? false)
    ),
    cancel: vi.fn(),
    resume: vi.fn(),
    clear: vi.fn()
  };
  TestBed.configureTestingModule({
    imports: [BatchRunPanelComponent],
    providers: [
      provideNoopAnimations(),
      { provide: BatchRunService, useValue: service }
    ]
  });
  const fixture = TestBed.createComponent(BatchRunPanelComponent);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const query = (testId: string) =>
    element.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  return { service, query, element };
}

describe('BatchRunPanelComponent', () => {
  it('renders nothing without a batch', () => {
    const { query } = render(null, false);
    expect(query('batch-run-panel')).toBeNull();
  });

  it('shows the progress, the outcomes so far and the running test', () => {
    const { query, element, service } = render(
      {
        projectSlug: 'example-project-slug',
        startedAt: '2026-10-23T12:00:00.000Z',
        items: [
          item('add_to_cart', 'passed'),
          item('view_item', 'error', 'No recording found'),
          item('purchase', 'running')
        ]
      },
      true
    );

    expect(query('batch-run-progress')?.textContent?.trim()).toBe('2 / 3');
    expect(element.textContent).toContain('Passed 1');
    expect(element.textContent).toContain('Error 1');
    expect(element.textContent).toContain('Running purchase');
    expect(query('batch-run-item-view_item')?.textContent).toContain(
      'No recording found'
    );
    expect(query('batch-run-resume')).toBeNull();
    expect(query('batch-run-clear')).toBeNull();

    query('batch-run-cancel')?.click();
    expect(service.cancel).toHaveBeenCalledOnce();
  });

  it('offers to resume a stopped batch and to clear it', () => {
    const { query, service } = render(
      {
        projectSlug: 'example-project-slug',
        startedAt: '2026-10-23T12:00:00.000Z',
        items: [item('add_to_cart', 'passed'), item('purchase', 'pending')]
      },
      false
    );

    expect(query('batch-run-cancel')).toBeNull();
    expect(query('batch-run-resume')?.textContent).toContain('1 left');

    query('batch-run-resume')?.click();
    query('batch-run-clear')?.click();
    expect(service.resume).toHaveBeenCalledOnce();
    expect(service.clear).toHaveBeenCalledOnce();
  });
});
