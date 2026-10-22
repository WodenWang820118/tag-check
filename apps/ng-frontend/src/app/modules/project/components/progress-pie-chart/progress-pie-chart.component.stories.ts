import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { ProgressPieChartComponent } from './progress-pie-chart.component';

import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PROJECT_ROUTES } from '../../routes';
import { ProgressEventsService } from '../../../../shared/services/progress-events/progress-events.service';
import { ProgressUpdateService } from '../../../../shared/services/progress-update/progress-update.service';

const mockProgressEventsService = {
  progressUpdate$: of({ totalSteps: 10, currentStep: 4 }),
  eventCompleted$: of({ message: '' }),
  openStream: () => undefined,
  closeStream: () => undefined
};

const meta: Meta<ProgressPieChartComponent> = {
  component: ProgressPieChartComponent,
  title: 'Modules/Project/Components/ProgressPieChartComponent',
  decorators: [
    moduleMetadata({
      imports: [],
      providers: [
        ProgressUpdateService,
        {
          provide: ProgressEventsService,
          useValue: mockProgressEventsService
        }
      ]
    }),
    applicationConfig({
      providers: [provideHttpClient(withXhr()), provideRouter(PROJECT_ROUTES)]
    })
  ]
};
export default meta;
type Story = StoryObj<ProgressPieChartComponent>;

export const Default: Story = {
  args: {}
};
