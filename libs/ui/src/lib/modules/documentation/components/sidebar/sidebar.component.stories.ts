import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { SideBarComponent } from './sidebar.component';

import { expect, fn, userEvent, within } from '@storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { TreeNodeService } from '../../services/tree-node/tree-node.service';
import { MarkdownModule } from 'ngx-markdown';
import { DOCS_ROUTES } from '../../routes';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';

const meta: Meta<SideBarComponent> = {
  component: SideBarComponent,
  title: 'Modules/Help-center/Components/SideBarComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [MatTreeModule, MatIconModule, MatButtonModule],
      providers: [TreeNodeService]
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(DOCS_ROUTES),
        importProvidersFrom(MarkdownModule.forRoot())
      ]
    })
  ]
};
export default meta;
type Story = StoryObj<SideBarComponent>;

export const Default: Story = {
  args: {}
};
