import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { ProjectItemComponent } from './project-item.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RouterLink, provideRouter } from '@angular/router';
import { ENTRY_ROUTES } from '../../routes';
import { ProjectIoService } from '../../../../shared/services/api/project-io/project-io.service';
import { MetadataSourceService } from '../../../../shared/services/metadata-source/metadata-source.service';

const meta: Meta<ProjectItemComponent> = {
  component: ProjectItemComponent,
  title: 'ProjectItemComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [MatCardModule, MatButtonModule, RouterLink],
      providers: [MatDialog, ProjectIoService, MetadataSourceService],
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(ENTRY_ROUTES),
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<ProjectItemComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/project-item works!/gi)).toBeTruthy();
  },
};
