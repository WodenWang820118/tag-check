import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { MainContentComponent } from './main-content.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { AsyncPipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { MarkdownModule, MarkdownService } from 'ngx-markdown';
import { TreeNodeService } from '../../../../shared/services/tree-node/tree-node.service';
import { HELP_CENTER_ROUTES } from '../../routes';
import { importProvidersFrom } from '@angular/core';

const meta: Meta<MainContentComponent> = {
  component: MainContentComponent,
  title: 'Modules/Help-center/Components/MainContentComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [AsyncPipe, MarkdownModule, MatButtonModule],
      providers: [MarkdownService, TreeNodeService],
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(HELP_CENTER_ROUTES),
        importProvidersFrom(MarkdownModule.forRoot()),
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<MainContentComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/main-content works!/gi)).toBeTruthy();
  },
};
