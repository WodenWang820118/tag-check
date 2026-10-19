import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { ProgressPieChartComponent } from './progress-pie-chart.component';

import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { ProgressUpdateService } from '../../../../shared/services/progress-update/progress-update.service';

const meta: Meta<ProgressPieChartComponent> = {
  component: ProgressPieChartComponent,
  title: 'Modules/Project/Components/ProgressPieChartComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [],
      providers: [ProgressUpdateService]
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
