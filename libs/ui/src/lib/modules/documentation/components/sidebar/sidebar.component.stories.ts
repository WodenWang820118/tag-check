import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { SideBarComponent } from './sidebar.component';

import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { DOCS_ROUTES } from '../../routes';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';

const meta: Meta<SideBarComponent> = {
  component: SideBarComponent,
  title: 'Modules/Help-center/Components/SideBarComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [MatTreeModule, MatIconModule, MatButtonModule]
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
type Story = StoryObj<SideBarComponent>;

export const Default: Story = {
  args: {}
};
