import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { ProjectItemComponent } from './project-item.component';

import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink, provideRouter } from '@angular/router';
import { ENTRY_ROUTES } from '../../routes';
import { ProjectIoService } from '../../../../shared/services/api/project-io/project-io.service';

const meta: Meta<ProjectItemComponent> = {
  component: ProjectItemComponent,
  title: 'Modules/Entry/Components/ProjectItemComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [MatCardModule, MatButtonModule, RouterLink],
      providers: [MatDialog, ProjectIoService]
    }),
    applicationConfig({
      providers: [provideHttpClient(), provideRouter(ENTRY_ROUTES)]
    })
  ]
};
export default meta;
type Story = StoryObj<ProjectItemComponent>;

export const Default: Story = {
  args: {}
};
