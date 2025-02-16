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

@Component({
  selector: 'app-progress-pie-chart',
  standalone: true,
  template: '<canvas #chart></canvas>',
  styles: ['canvas { max-width: 30px; max-height: 30px; }']
})
export class ProgressPieChartComponent {
  chartRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chart');
  chart = signal<Chart | null>(null);
  isFirstRender = signal<boolean>(true);

  constructor(private progressUpdateService: ProgressUpdateService) {
    // Setup effect to handle chart updates
    effect(
      () => {
        const current = this.progressUpdateService.currentStep$();
        const total = this.progressUpdateService.totalSteps$();

        if (current > 0 && total > 0) {
          if (this.isFirstRender()) {
            this.createChart();
            this.isFirstRender.set(false);
          }
          this.updateChart();
        }
      },
      { allowSignalWrites: true }
    );
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
    const currentStep = this.progressUpdateService.currentStep$();
    const totalSteps = this.progressUpdateService.totalSteps$();

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
            ctx.fillText(`${currentStep}/${totalSteps}`, centerX, centerY);
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
