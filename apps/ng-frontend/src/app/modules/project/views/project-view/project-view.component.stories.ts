import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { ProjectViewComponent } from './project-view.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, RouterOutlet } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { AsyncPipe } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';
import { ProjectInfoService } from '../../../../shared/services/api/project-info/project-info.service';
import { SettingsService } from '../../../../shared/services/api/settings/settings.service';
import { SideNavListComponent } from '../../components/side-nav-list/side-nav-list.component';

const meta: Meta<ProjectViewComponent> = {
  component: ProjectViewComponent,
  title: 'ProjectViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        AsyncPipe,
        RouterOutlet,
        MatSidenavModule,
        ToolbarComponent,
        SideNavListComponent,
      ],
      providers: [ProjectInfoService, SettingsService],
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
type Story = StoryObj<ProjectViewComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/project-view works!/gi)).toBeTruthy();
  },
};
