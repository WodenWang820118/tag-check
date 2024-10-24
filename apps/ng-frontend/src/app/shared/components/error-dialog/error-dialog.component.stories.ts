import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { ErrorDialogComponent } from './error-dialog.component';

import { expect, fn, userEvent, within } from '@storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

const meta: Meta<ErrorDialogComponent> = {
  component: ErrorDialogComponent,
  title: 'Shared/Components/ErrorDialogComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { message: 'This is a test error message' },
        },
      ],
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
type Story = StoryObj<ErrorDialogComponent>;

export const Default: Story = {
  args: {},
};
