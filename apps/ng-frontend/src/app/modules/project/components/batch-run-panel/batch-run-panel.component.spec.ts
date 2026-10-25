import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { BatchRunStatus } from '@utils';
import {
  BatchItem,
  BatchRun,
  BatchRunService
} from '../../services/batch-run/batch-run.service';
import { BatchRunPanelComponent } from './batch-run-panel.component';

function item(
  position: number,
  eventName: string,
  status: BatchItem['status'],
  message: string | null = null
): BatchItem {
  return {
    id: position + 1,
    eventId: `id-${eventName}`,
    testName: eventName,
    eventName,
    position,
    status,
    message,
    startedAt: null,
    finishedAt: null,
    testEventDetailId: null
  };
}

/** A batch as GET /batch-runs/:projectSlug returns it (dates are strings). */
function batchJson(
  status: BatchRunStatus,
  items: BatchItem[],
  source: BatchRun['source'] = 'manual'
): BatchRun {
  return JSON.parse(
    JSON.stringify({
      id: 3,
      projectSlug: 'example-project-slug',
      source,
      scheduleId: source === 'schedule' ? 1 : null,
      headless: true,
      status,
      createdAt: '2026-10-25T09:00:00.000Z',
      startedAt: '2026-10-25T09:00:01.000Z',
      finishedAt: null,
      items
    })
  ) as BatchRun;
}

function render(batch: BatchRun | null) {
  const state = signal(batch);
  const isActive = () =>
    state()?.status === 'pending' || state()?.status === 'running';
  const service = {
    batch: state.asReadonly(),
    isRunning: computed(isActive),
    currentItem: computed(() =>
      state()?.items.find((entry) => entry.status === 'running')
    ),
    doneCount: computed(
      () =>
        state()?.items.filter(
          (entry) => entry.status !== 'pending' && entry.status !== 'running'
        ).length ?? 0
    ),
    remainingCount: computed(() =>
      state()?.status === 'cancelled'
        ? (state()?.items.filter((entry) => entry.status === 'cancelled')
            .length ?? 0)
        : 0
    ),
    canResume: computed(() => state()?.status === 'cancelled'),
    watch: vi.fn(),
    unwatch: vi.fn(),
    cancel: vi.fn(),
    resume: vi.fn(() => Promise.resolve('Unknown tests: id-purchase')),
    clear: vi.fn()
  };
  TestBed.configureTestingModule({
    imports: [BatchRunPanelComponent],
    providers: [
      provideNoopAnimations(),
      { provide: BatchRunService, useValue: service },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(
            convertToParamMap({ projectSlug: 'example-project-slug' })
          )
        }
      }
    ]
  });
  const fixture = TestBed.createComponent(BatchRunPanelComponent);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const query = (testId: string) =>
    element.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  return { service, query, element, fixture };
}

describe('BatchRunPanelComponent', () => {
  it("renders nothing without a batch and follows the page's project", () => {
    const { query, service, fixture } = render(null);

    expect(query('batch-run-panel')).toBeNull();
    expect(service.watch).toHaveBeenCalledWith('example-project-slug');

    fixture.destroy();
    expect(service.unwatch).toHaveBeenCalledOnce();
  });

  it('shows the progress, the outcomes so far and the running test', () => {
    const { query, element, service } = render(
      batchJson('running', [
        item(0, 'add_to_cart', 'passed'),
        item(1, 'view_item', 'error', 'No recording found'),
        item(2, 'purchase', 'running')
      ])
    );

    expect(query('batch-run-progress')?.textContent?.trim()).toBe('2 / 3');
    expect(element.textContent).toContain('Batch run');
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

  it('offers to run the rest of a cancelled batch again, and to clear it', async () => {
    const { query, service, fixture, element } = render(
      batchJson(
        'cancelled',
        [
          item(0, 'add_to_cart', 'passed'),
          item(1, 'purchase', 'cancelled', 'Cancelled')
        ],
        'schedule'
      )
    );

    expect(element.textContent).toContain('Scheduled batch run');
    expect(query('batch-run-cancel')).toBeNull();
    expect(query('batch-run-resume')?.textContent).toContain('1 left');

    query('batch-run-resume')?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(service.resume).toHaveBeenCalledOnce();
    expect(query('batch-run-error')?.textContent).toContain(
      'Unknown tests: id-purchase'
    );

    query('batch-run-clear')?.click();
    expect(service.clear).toHaveBeenCalledOnce();
  });
});
