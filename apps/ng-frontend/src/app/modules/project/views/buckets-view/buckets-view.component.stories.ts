import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { BucketsViewComponent } from './buckets-view.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { FileTableToolbarComponent } from '../../components/file-table-toolbar/file-table-toolbar.component';
import { FileTableComponent } from '../../components/file-table/file-table.component';

const meta: Meta<BucketsViewComponent> = {
  component: BucketsViewComponent,
  title: 'BucketsViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [FileTableComponent, FileTableToolbarComponent],
      providers: [],
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
type Story = StoryObj<BucketsViewComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/buckets-view works!/gi)).toBeTruthy();
  },
};