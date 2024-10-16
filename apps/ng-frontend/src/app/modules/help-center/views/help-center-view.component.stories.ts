import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { HelpCenterViewComponent } from './help-center-view.component';

import { expect, fn, userEvent, within } from '@storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, RouterOutlet } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { TreeNodeService } from '../../../shared/services/tree-node/tree-node.service';
import { HELP_CENTER_ROUTES } from '../routes';
import { AsyncPipe } from '@angular/common';
import { SideBarComponent } from '../components/sidebar/sidebar.component';

const meta: Meta<HelpCenterViewComponent> = {
  component: HelpCenterViewComponent,
  title: 'Modules/Help-center/Views/HelpCenterViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [AsyncPipe, SideBarComponent, RouterOutlet],
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
type Story = StoryObj<HelpCenterViewComponent>;

export const Default: Story = {
  args: {},
};
