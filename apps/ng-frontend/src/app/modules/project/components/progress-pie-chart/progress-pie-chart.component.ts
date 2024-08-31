import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  PieController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { ProgressUpdateService } from '../../../../shared/services/progress-update/progress-update.service';
import { combineLatest, Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-progress-pie-chart',
  standalone: true,
  template: '<canvas #chart></canvas>',
  styles: ['canvas { max-width: 30px; max-height: 30px; }'],
})
export class ProgressPieChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chart') private chartRef!: ElementRef;
  private chart!: Chart;

  isFirstRender = true;
  totalSteps = 0;
  currentStep = 0;
  completedSteps: boolean[] = Array(this.totalSteps).fill(false);
  destroyed$ = new Subject<void>();

  constructor(private progressUpdateService: ProgressUpdateService) {}

  ngAfterViewInit() {
    combineLatest([
      this.progressUpdateService.getCurrentStep(),
      this.progressUpdateService.getTotalSteps(),
    ])
      .pipe(
        takeUntil(this.destroyed$),
        tap(([currentStep, totalSteps]) => {
          if (currentStep > 0 && totalSteps > 0) {
            console.log('currentStep', currentStep);
            console.log('totalSteps', totalSteps);
            this.currentStep = currentStep;
            this.totalSteps = totalSteps;

            if (this.completedSteps.length !== totalSteps) {
              this.completedSteps = Array(totalSteps).fill(false);
            }

            // Mark all steps before the current step as completed
            for (let i = 0; i < currentStep - 1; i++) {
              this.completedSteps[i] = true;
            }

            if (this.isFirstRender) {
              this.createChart();
              this.isFirstRender = false;
            }

            this.updateChart();
          }
        })
      )
      .subscribe();
  }

  createChart() {
    Chart.register(PieController, ArcElement, Tooltip, Legend);
    const ctx = this.chartRef.nativeElement.getContext('2d');
    console.log('this.totalSteps', this.totalSteps);
    const data: ChartData = {
      labels: Array.from(
        { length: this.totalSteps },
        (_, i) => `Step ${i + 1}`
      ),
      datasets: [
        {
          data: Array(this.totalSteps).fill(1),
          backgroundColor: Array(this.totalSteps).fill('#e0e0e0'),
          borderWidth: 1,
        },
      ],
    };

    const config: ChartConfiguration = {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
      },
      plugins: [
        {
          id: 'centerText',
          afterDraw: (chart) => {
            const ctx = chart.ctx;
            const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

            ctx.save();
            ctx.font = '10px Arial';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              `${this.currentStep}/${this.totalSteps}`,
              centerX,
              centerY
            );
            ctx.restore();
          },
        },
      ],
    };

    this.chart = new Chart(ctx, config);
  }

  updateChart() {
    if (this.chart && this.chart.data && this.chart.data.datasets) {
      const newBackgroundColors = this.chart.data.datasets[0]
        .backgroundColor as string[];
      for (let i = 0; i < this.totalSteps; i++) {
        if (i < this.currentStep - 1) {
          newBackgroundColors[i] = '#4caf50'; // Completed step
        } else if (i === this.currentStep - 1) {
          newBackgroundColors[i] = '#2196f3'; // Current step
        } else {
          newBackgroundColors[i] = '#e0e0e0'; // Future step
        }
      }
      this.chart.data.datasets[0].backgroundColor = newBackgroundColors;
      this.chart.update();
    }
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
