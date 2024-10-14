import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { ProjectListComponent } from './project-list.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RouterLink, provideRouter } from '@angular/router';
import { MetadataSourceService } from '../../../../shared/services/metadata-source/metadata-source.service';
import { ENTRY_ROUTES } from '../../routes';
import { AsyncPipe, NgIf } from '@angular/common';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { ProjectItemComponent } from '../project-item/project-item.component';
import { MetadataSourceFacadeService } from '../../../../shared/services/facade/metadata-source-facade.service';

const meta: Meta<ProjectListComponent> = {
  component: ProjectListComponent,
  title: 'ProjectListComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        AsyncPipe,
        NgIf,
        ProjectItemComponent,
        MatCardModule,
        RouterLink,
        PaginatorComponent,
      ],
      providers: [MetadataSourceService, MetadataSourceFacadeService],
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
type Story = StoryObj<ProjectListComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/project-list works!/gi)).toBeTruthy();
  },
};