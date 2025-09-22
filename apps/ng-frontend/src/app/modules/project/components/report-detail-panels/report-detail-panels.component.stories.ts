import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { ReportDetailPanelsComponent } from './report-detail-panels.component';

import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorService } from '@data-access';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { SpecService } from '../../../../shared/services/api/spec/spec.service';
import { UtilsService } from '../../../../shared/services/utils/utils.service';

const meta: Meta<ReportDetailPanelsComponent> = {
  component: ReportDetailPanelsComponent,
  title: 'Modules/Project/Components/ReportDetailPanelsComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        AsyncPipe,
        JsonPipe,
        MatIconModule,
        MatExpansionModule,
        MatTooltipModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule
      ],
      providers: [
        RecordingService,
        SpecService,
        ReportService,
        EditorService,
        MatDialog,
        UtilsService
      ]
    }),
    applicationConfig({
      providers: [provideHttpClient(), provideRouter(PROJECT_ROUTES)]
    })
  ]
};
export default meta;
type Story = StoryObj<ReportDetailPanelsComponent>;

export const Default: Story = {
  args: {}
};
