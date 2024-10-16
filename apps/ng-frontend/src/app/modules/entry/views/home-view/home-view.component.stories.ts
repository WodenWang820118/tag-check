import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { HomeViewComponent } from './home-view.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { ENTRY_ROUTES } from '../../routes';
import { MetadataSourceService } from '../../../../shared/services/metadata-source/metadata-source.service';
import { ProjectListComponent } from '../../components/project-list/project-list.component';

const meta: Meta<HomeViewComponent> = {
  component: HomeViewComponent,
  title: 'Modules/Entry/Views/HomeViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [ProjectListComponent],
      providers: [MetadataSourceService],
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
type Story = StoryObj<HomeViewComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/home-view works!/gi)).toBeTruthy();
  },
};
