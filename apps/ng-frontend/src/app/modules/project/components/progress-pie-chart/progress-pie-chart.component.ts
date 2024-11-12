import {
  Component,
  AfterViewInit,
  computed,
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
export class ProgressPieChartComponent implements AfterViewInit {
  chart = signal<Chart | null>(null);
  chartRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chart');
  currentStep = signal<number>(0);
  totalSteps = signal<number>(0);
  isFirstRender = signal<boolean>(true);

  completedSteps = computed(() =>
    Array(this.totalSteps())
      .fill(false)
      .map((_, index) => index < this.currentStep() - 1)
  );

  constructor(private progressUpdateService: ProgressUpdateService) {
    // Setup effect to handle chart updates
    effect(
      () => {
        const current = this.currentStep();
        const total = this.totalSteps();

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

  ngAfterViewInit() {
    // Subscribe to service updates
    this.progressUpdateService
      .getCurrentStep()
      .subscribe((step) => this.currentStep.set(step));

    this.progressUpdateService
      .getTotalSteps()
      .subscribe((total) => this.totalSteps.set(total));
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
        { length: this.totalSteps() },
        (_, i) => `Step ${i + 1}`
      ),
      datasets: [
        {
          data: Array(this.totalSteps()).fill(1),
          backgroundColor: Array(this.totalSteps()).fill('#e0e0e0'),
          borderWidth: 1
        }
      ]
    };

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
            ctx.fillText(
              `${this.currentStep()}/${this.totalSteps()}`,
              centerX,
              centerY
            );
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
      const newBackgroundColors = Array(this.totalSteps())
        .fill('')
        .map((_, i) => {
          if (i < this.currentStep() - 1) {
            return '#009688'; // Completed step
          } else if (i === this.currentStep() - 1) {
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
