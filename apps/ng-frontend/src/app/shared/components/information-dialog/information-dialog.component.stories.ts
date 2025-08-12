import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { InformationDialogComponent } from './information-dialog.component';

import { expect, fn, userEvent, within } from 'storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';

// Mock MatDialogRef
const mockDialogRef = {
  close: () => {},
};

// Mock dialog data
const mockDialogData = {
  title: 'Test Title',
  contents: 'Test Contents',
  action: 'Confirm',
  actionColor: 'primary',
  consent: false,
};

const meta: Meta<InformationDialogComponent> = {
  component: InformationDialogComponent,
  title: 'Shared/Components/InformationDialogComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [MatDialogModule, MatButtonModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
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
type Story = StoryObj<InformationDialogComponent>;

export const Default: Story = {
  args: {},
};
