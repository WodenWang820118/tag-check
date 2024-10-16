import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { GlobalSettingsViewComponent } from './global-settings-view.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { ENTRY_ROUTES } from '../../routes';
import { RootFormComponent } from '../../../../shared/components/root-form/root-form.component';

const meta: Meta<GlobalSettingsViewComponent> = {
  component: GlobalSettingsViewComponent,
  title: 'Modules/Entry/Views/GlobalSettingsViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [RootFormComponent],
      providers: [],
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
type Story = StoryObj<GlobalSettingsViewComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/global-settings-view works!/gi)).toBeTruthy();
  },
};
