import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { OverlayComponent } from './overlay.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { FileTableDataSourceService } from '../../../../shared/services/file-table-data-source/file-table-data-source.service';
import { PROJECT_ROUTES } from '../../routes';
import { OverlayModule } from '@angular/cdk/overlay';

const meta: Meta<OverlayComponent> = {
  component: OverlayComponent,
  title: 'OverlayComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [OverlayModule],
      providers: [FileTableDataSourceService],
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
type Story = StoryObj<OverlayComponent>;

export const Primary: Story = {
  args: {
    isOpen: false,
  },
};

export const Heading: Story = {
  args: {
    isOpen: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/overlay works!/gi)).toBeTruthy();
  },
};
