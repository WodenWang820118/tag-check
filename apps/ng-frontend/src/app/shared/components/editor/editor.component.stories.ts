import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { EditorComponent } from './editor.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { EditorService } from '@data-access';
import { APP_ROUTES } from '../../../app.routes';

const meta: Meta<EditorComponent> = {
  component: EditorComponent,
  title: 'EditorComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [],
      providers: [EditorService],
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
type Story = StoryObj<EditorComponent>;

export const Primary: Story = {
  args: {
    content: '',
    editMode: false,
  },
};

export const Heading: Story = {
  args: {
    content: '',
    editMode: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/editor works!/gi)).toBeTruthy();
  },
};
