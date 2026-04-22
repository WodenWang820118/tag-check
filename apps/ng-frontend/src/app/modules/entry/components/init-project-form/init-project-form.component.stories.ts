import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { InitProjectFormComponent } from './init-project-form.component';

import { expect, userEvent, within } from 'storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideRouter, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';
import { ENTRY_ROUTES } from '../../../../modules/entry/routes';
import { MatIconModule } from '@angular/material/icon';

const meta: Meta<InitProjectFormComponent> = {
  component: InitProjectFormComponent,
  title: 'Modules/Entry/Components/InitProjectFormComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        MatIconModule,
        MatCardModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        RouterLink
      ],
      providers: [FormBuilder, ConfigurationService, MatDialog]
    }),
    applicationConfig({
      providers: [provideHttpClient(), provideRouter(ENTRY_ROUTES)]
    })
  ]
};
export default meta;
type Story = StoryObj<InitProjectFormComponent>;

export const Default: Story = {
  args: {}
};

export const Form: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/Project Name/i)).toBeTruthy();
    expect(canvas.getByText(/Generated Project Slug/i)).toBeTruthy();
    expect(canvas.getByText(/Measurement ID/i)).toBeTruthy();
    expect(canvas.getByText(/Project Description/i)).toBeTruthy();
  }
};

export const ErrorMessage: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submitBtn = canvas.getByText(/Submit/i);
    expect(submitBtn).toBeTruthy();
    await userEvent.click(submitBtn);

    const errorText = await within(document.body).findByText(
      /Please fill in the required fields\./i
    );
    expect(errorText).toBeTruthy();
  }
};
