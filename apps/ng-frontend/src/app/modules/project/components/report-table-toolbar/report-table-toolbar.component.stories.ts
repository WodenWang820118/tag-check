import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { ReportTableToolbarComponent } from './report-table-toolbar.component';

import { expect, within } from 'storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RouterLink, provideRouter } from '@angular/router';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { PROJECT_ROUTES } from '../../routes';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

const meta: Meta<ReportTableToolbarComponent> = {
  component: ReportTableToolbarComponent,
  title: 'Modules/Project/Components/ReportTableToolbarComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        RouterLink,
        MatIconModule,
        MatToolbarModule,
        MatButtonModule,
        MatTooltipModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonToggleModule
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
type Story = StoryObj<ReportTableToolbarComponent>;

export const Default: Story = {
  args: {}
};

export const Searching: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttonToggle = await canvas.findByText('search');

    // Verify that the toggle exists
    expect(buttonToggle).toBeTruthy();
    buttonToggle.click();
  }
};
