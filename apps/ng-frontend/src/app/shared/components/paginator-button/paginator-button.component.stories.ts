import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { PaginatorButtonComponent } from './paginator-button.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';

const meta: Meta<PaginatorButtonComponent> = {
  component: PaginatorButtonComponent,
  title: 'Shared/Components/PaginatorButtonComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [MatButtonModule],
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
type Story = StoryObj<PaginatorButtonComponent>;

export const Primary: Story = {
  args: {
    label: '',
    disabled: false,
  },
};

export const Heading: Story = {
  args: {
    label: '',
    disabled: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/paginator-button works!/gi)).toBeTruthy();
  },
};
