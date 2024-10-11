import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { TagBuildViewComponent } from './tag-build-view.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { AsyncPipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { TagBuildPageComponent } from '@ui';
import { SettingsService } from '../../../shared/services/api/settings/settings.service';
import { SpecService } from '../../../shared/services/api/spec/spec.service';
import { TAG_BUILD_ROUTES } from '../routes';

const meta: Meta<TagBuildViewComponent> = {
  component: TagBuildViewComponent,
  title: 'TagBuildViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [AsyncPipe, TagBuildPageComponent],
      providers: [SpecService, SettingsService],
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(TAG_BUILD_ROUTES),
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<TagBuildViewComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/tag-build-view works!/gi)).toBeTruthy();
  },
};
