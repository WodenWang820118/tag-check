import {
  Component,
  signal,
  effect,
  viewChild,
  ElementRef
} from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  PieController,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { ProgressUpdateService } from '../../../../shared/services/progress-update/progress-update.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-progress-pie-chart',
  imports: [MatProgressSpinnerModule],
  template: `
    @if (!spinnerVisible()) {
      <ng-container>
        <canvas #chart></canvas>
      </ng-container>
    } @else {
      <mat-progress-spinner
        mode="indeterminate"
        diameter="30"
      ></mat-progress-spinner>
    }
  `,
  styles: ['canvas { max-width: 30px; max-height: 30px; }']
})
export class ProgressPieChartComponent {
  chartRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chart');
  chart = signal<Chart | null>(null);
  // Track last total steps and spinner state
  private lastTotalSteps = 0;
  spinnerVisible = signal<boolean>(false);

  constructor(private readonly progressUpdateService: ProgressUpdateService) {
    // Setup effect to handle chart updates
    effect(() => {
      // track totalSteps for chart recreation and update
      const total = this.progressUpdateService.totalSteps$();

      // Show spinner when test finished (total reset from non-zero)
      if (total === 0) {
        if (
          this.lastTotalSteps > 0 &&
          this.progressUpdateService.eventCompleted$()
        ) {
          this.spinnerVisible.set(true);
          // reset completion flag to prevent repeated triggers
          this.progressUpdateService.setEventCompleted(false);
        }
        this.destroyChart();
        this.lastTotalSteps = 0;
        return;
      }

      // hide spinner when new test progress begins
      if (this.spinnerVisible()) {
        this.spinnerVisible.set(false);
      }

      // Create or recreate chart if needed
      if (!this.chart() || total !== this.lastTotalSteps) {
        this.createChart();
        this.lastTotalSteps = total;
      }
      this.updateChart();
    });
  }

  private destroyChart() {
    const chartInstance = this.chart();
    if (chartInstance) {
      chartInstance.destroy();
      this.chart.set(null);
    }
  }

  private createChart() {
    // First destroy any existing chart
    this.destroyChart();

    Chart.register(PieController, ArcElement, Tooltip, Legend);

    const canvas = this.chartRef()?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data: ChartData = {
      labels: Array.from(
        { length: this.progressUpdateService.totalSteps$() },
        (_, i) => `Step ${i + 1}`
      ),
      datasets: [
        {
          data: Array(this.progressUpdateService.totalSteps$()).fill(1),
          backgroundColor: Array(this.progressUpdateService.totalSteps$()).fill(
            '#e0e0e0'
          ),
          borderWidth: 1
        }
      ]
    };
    // Plugin will use dynamic values for current and total, so remove stale captures

    const config: ChartConfiguration = {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        }
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
            // Draw up-to-date progress in center
            const cur = this.progressUpdateService.currentStep$();
            const tot = this.progressUpdateService.totalSteps$();
            ctx.fillText(`${cur}/${tot}`, centerX, centerY);
            ctx.restore();
          }
        }
      ]
    };

    this.chart.set(new Chart(ctx, config));
  }

  private updateChart() {
    const chartInstance = this.chart();
    if (chartInstance?.data?.datasets) {
      const newBackgroundColors = Array(
        this.progressUpdateService.totalSteps$()
      )
        .fill('')
        .map((_, i) => {
          if (i < this.progressUpdateService.currentStep$() - 1) {
            return '#009688'; // Completed step
          } else if (i === this.progressUpdateService.currentStep$() - 1) {
            return '#FFCA28'; // Current step
          } else {
            return '#e0e0e0'; // Future step
          }
        });

      chartInstance.data.datasets[0].backgroundColor = newBackgroundColors;
      chartInstance.update();
    }
  }
}
