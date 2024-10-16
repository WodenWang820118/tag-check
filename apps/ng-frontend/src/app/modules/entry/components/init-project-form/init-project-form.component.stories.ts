import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { InitProjectFormComponent } from './init-project-form.component';

import { waitFor, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { ErrorDialogComponent } from '@ui';
import { MatDialog } from '@angular/material/dialog';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';
import { ProjectInfoService } from '../../../../shared/services/api/project-info/project-info.service';
import { ENTRY_ROUTES } from '../../../../modules/entry/routes';

const meta: Meta<InitProjectFormComponent> = {
  component: InitProjectFormComponent,
  title: 'Modules/Entry/Components/InitProjectFormComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        NgIf,
        MatCardModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        RouterLink,
        ErrorDialogComponent,
      ],
      providers: [
        FormBuilder,
        ProjectInfoService,
        Router,
        ConfigurationService,
        MatDialog,
      ],
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
type Story = StoryObj<InitProjectFormComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/New Project/gi)).toBeTruthy();
  },
};

export const Form: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/Project Name/gi)).toBeTruthy();
    expect(canvas.getByText(/Measurement ID/gi)).toBeTruthy();
    expect(canvas.getByText(/Description/gi)).toBeTruthy();
    expect(canvas.getByText(/Spreadsheet/gi)).toBeTruthy();
  },
};

export const ErrorMessage: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submitBtn = canvas.getByText(/Submit/gi);
    expect(submitBtn).toBeTruthy();
    submitBtn.click();

    // TODO:  bad practice to access DOM directly
    const errorDialog = document.querySelector('.error-dialog') as HTMLElement;
    const errorText = await within(errorDialog).findByText(/Error/i);
    expect(errorText).toBeTruthy();
  },
};
