import { signal } from '@angular/core';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { FileTableToolbarComponent } from './file-table-toolbar.component';

import { expect, within } from '@storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

const meta: Meta<FileTableToolbarComponent> = {
  component: FileTableToolbarComponent,
  title: 'Modules/Project/Components/FileTableToolbarComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        MatIconModule,
        MatToolbarModule,
        MatButtonModule,
        MatTooltipModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonToggleModule
      ],
      providers: []
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(PROJECT_ROUTES)
      ]
    })
  ],
  args: {
    isSearchVisible: signal(false)
  },
  argTypes: {
    isSearchVisible: { control: 'boolean' }
  }
};
export default meta;
type Story = StoryObj<FileTableToolbarComponent>;

export const Default: Story = {
  args: {}
};

export const Searching: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Find the mat-button-toggle
    const buttonToggle = await canvas.findByText('search');

    // Verify that the toggle exists
    expect(buttonToggle).toBeTruthy();
    buttonToggle.click();
  }
};
