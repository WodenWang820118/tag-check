import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Chart } from 'chart.js';
import { describe, expect, it, vi } from 'vitest';
import { ProgressUpdateService } from '../../../../shared/services/progress-update/progress-update.service';
import { ProgressPieChartComponent } from './progress-pie-chart.component';

describe('ProgressPieChartComponent', () => {
  it('destroys its chart when the run ends and the row removes it', () => {
    // jsdom cannot draw on a canvas, so the component makes no chart.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProgressUpdateService,
          useValue: {
            currentStep$: signal(2),
            totalSteps$: signal(5),
            eventCompleted$: signal(false),
            setEventCompleted: vi.fn()
          }
        }
      ]
    });
    const fixture = TestBed.createComponent(ProgressPieChartComponent);
    fixture.detectChanges();
    // Stand in for the chart it would have drawn mid-run.
    const destroy = vi.fn();
    fixture.componentInstance.chart.set({ destroy } as unknown as Chart);
    fixture.detectChanges();
    expect(destroy).not.toHaveBeenCalled();

    fixture.destroy();

    expect(destroy).toHaveBeenCalledOnce();
  });
});
