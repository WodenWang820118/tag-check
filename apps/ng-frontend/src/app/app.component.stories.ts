import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { AppComponent } from './app.component';

import { expect, fn, userEvent, within } from '@storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RouterOutlet, provideRouter } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { ToolbarComponent } from './shared/components/toolbar/toolbar.component';

const meta: Meta<AppComponent> = {
  component: AppComponent,
  title: 'AppComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [RouterOutlet, ToolbarComponent],
      providers: [],
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(APP_ROUTES),
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<AppComponent>;

export const Default: Story = {
  args: {},
};
