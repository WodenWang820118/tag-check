import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { NewReportViewComponent } from './new-report-view.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EditorService } from '@data-access';
import { ErrorDialogComponent } from '@ui';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { SpecService } from '../../../../shared/services/api/spec/spec.service';
import { ProjectDataSourceService } from '../../../../shared/services/project-data-source/project-data-source.service';
import { EditorComponent } from 'libs/ui/src/lib/components/editor/editor.component';

const meta: Meta<NewReportViewComponent> = {
  component: NewReportViewComponent,
  title: 'NewReportViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatButtonModule,
        EditorComponent,
        ErrorDialogComponent,
      ],
      providers: [
        RecordingService,
        ReportService,
        SpecService,
        ProjectDataSourceService,
        EditorService,
        MatDialog,
      ],
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(PROJECT_ROUTES),
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<NewReportViewComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/new-report-view works!/gi)).toBeTruthy();
  },
};
