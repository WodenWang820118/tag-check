import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { SideBarComponent } from './sidebar.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { TreeNodeService } from '../../../../shared/services/tree-node/tree-node.service';
import { MarkdownModule } from 'ngx-markdown';
import { HELP_CENTER_ROUTES } from '../../routes';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';

const meta: Meta<SideBarComponent> = {
  component: SideBarComponent,
  title: 'Modules/Help-center/Components/SideBarComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [MatTreeModule, MatIconModule, MatButtonModule],
      providers: [TreeNodeService],
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
type Story = StoryObj<SideBarComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/sidebar works!/gi)).toBeTruthy();
  },
};
