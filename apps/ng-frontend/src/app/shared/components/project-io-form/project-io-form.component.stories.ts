import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { ProjectIoFormComponent } from './project-io-form.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';
import { ProjectIoService } from '../../services/api/project-io/project-io.service';
import { InformationDialogComponent } from '../information-dialog/information-dialog.component';

const meta: Meta<ProjectIoFormComponent> = {
  component: ProjectIoFormComponent,
  title: 'ProjectIoFormComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [MatButtonModule, MatCardModule, InformationDialogComponent],
      providers: [ProjectIoService],
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(APP_ROUTES),
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<ProjectIoFormComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/project-io-form works!/gi)).toBeTruthy();
  },
};
