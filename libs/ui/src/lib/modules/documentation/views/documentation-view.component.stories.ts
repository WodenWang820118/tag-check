import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { HelpCenterViewComponent } from './documentation-view.component';

import { provideHttpClient } from '@angular/common/http';
import { provideRouter, RouterOutlet } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { DOCS_ROUTES } from '../routes';
import { AsyncPipe } from '@angular/common';
import { SideBarComponent } from '../components/sidebar/sidebar.component';

const meta: Meta<HelpCenterViewComponent> = {
  component: HelpCenterViewComponent,
  title: 'Modules/Help-center/Views/HelpCenterViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [AsyncPipe, SideBarComponent, RouterOutlet]
    }),
    applicationConfig({
      providers: [
        provideHttpClient(),
        provideRouter(DOCS_ROUTES),
        provideMarkdown()
      ]
    })
  ]
};
export default meta;
type Story = StoryObj<HelpCenterViewComponent>;

export const Default: Story = {
  args: {}
};
