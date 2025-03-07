import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { ReportTableComponent } from './report-table.component';

import { expect, fn, userEvent, within } from '@storybook/test';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, RouterLink } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ProgressPieChartComponent } from '../progress-pie-chart/progress-pie-chart.component';

const meta: Meta<ReportTableComponent> = {
  component: ReportTableComponent,
  title: 'Modules/Project/Components/ReportTableComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        AsyncPipe,
        DatePipe,
        NgClass,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        RouterLink,
        MatPaginatorModule,
        MatInputModule,
        MatCheckboxModule,
        MatBadgeModule,
        ProgressPieChartComponent
      ],
      providers: [TestRunningFacadeService]
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(PROJECT_ROUTES)
      ]
    })
  ]
};
export default meta;
type Story = StoryObj<ReportTableComponent>;

export const Default: Story = {
  args: {}
};
