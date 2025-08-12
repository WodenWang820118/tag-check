import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { ProjectListComponent } from './project-list.component';

import { expect, fn, userEvent, within } from 'storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RouterLink, provideRouter } from '@angular/router';
import { ENTRY_ROUTES } from '../../routes';
import { AsyncPipe, NgIf } from '@angular/common';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { ProjectItemComponent } from '../project-item/project-item.component';

const meta: Meta<ProjectListComponent> = {
  component: ProjectListComponent,
  title: 'Modules/Entry/Components/ProjectListComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        AsyncPipe,
        NgIf,
        ProjectItemComponent,
        MatCardModule,
        RouterLink,
        PaginatorComponent
      ],
      providers: []
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(ENTRY_ROUTES)
      ]
    })
  ]
};
export default meta;
type Story = StoryObj<ProjectListComponent>;

export const Default: Story = {
  args: {}
};
